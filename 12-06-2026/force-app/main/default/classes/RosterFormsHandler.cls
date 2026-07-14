public  class RosterFormsHandler {
      // ===== Wrapper returned to LWC =====
    public class FormWrapper {
        @AuraEnabled public String formId;
        @AuraEnabled public String formName;

        public FormWrapper(String fId, String fName){
            this.formId = fId;
            this.formName = fName;
        }
    }

    // ===== Main Method =====
    @AuraEnabled(cacheable=true)
    public static List<FormWrapper> getParticipantForms(Id participantId){

        List<FormWrapper> result = new List<FormWrapper>();

        if(participantId == null){
            return result;
        }

        // --- Query Participant ---
        Client__c participantRec = [
            SELECT Id, Accessible_Forms__c     // <-- CHANGE FIELD API NAME
            FROM Client__c        // <-- CHANGE OBJECT API NAME
            WHERE Id = :participantId
            LIMIT 1
        ];

        if(String.isBlank(participantRec.Accessible_Forms__c)){
            return result;
        }

        // --- Split New Line Form Ids ---
        List<String> formIdStrings = participantRec.Accessible_Forms__c.split('\\r?\\n');

        Set<Id> formIds = new Set<Id>();

        for(String fId : formIdStrings){
            if(!String.isBlank(fId)){
                formIds.add((Id)fId.trim());
            }
        }

        if(formIds.isEmpty()){
            return result;
        }

        // --- Query Forms ---
        List<Dynamic_Form__c> forms = [
            SELECT Id, Name,Name__c           // <-- CHANGE OBJECT / FIELDS
            FROM Dynamic_Form__c
            WHERE Id IN :formIds AND Audience__c = 'Participant'
        ];

        // --- Prepare Wrapper ---
        for(Dynamic_Form__c f : forms){
            result.add(new FormWrapper(f.Id, f.Name__c));
        }

        return result;
    }
    
}