public with sharing class TLearnerController {

@AuraEnabled
public static Id createTLearner(
    String title,
    String description,
    Id organizationId,
    String awsJson,
    String platformValue,
    String roleValue,
    Date expireDate
) {
    if (String.isBlank(title)) throw new AuraHandledException('Title is required');
    if (organizationId == null) throw new AuraHandledException('Organization is required');
    if (String.isBlank(platformValue)) throw new AuraHandledException('Platform is required');
    if (String.isBlank(roleValue)) throw new AuraHandledException('Role is required');

    Tlearner__c rec = new Tlearner__c();
    rec.Title__c = title.trim();
    rec.Description__c = description;
    rec.Organization__c = organizationId;
    rec.AWS_Json__c = awsJson;
    rec.Platform__c = platformValue;
    rec.Role__c = roleValue;

    rec.Expire_Date__c = (expireDate != null) ? expireDate : Date.today().addDays(120);

    insert rec;
    return rec.Id;
}


    // -----------------------------
    // Fetch videos for an org
    // platformValue/roleValue are OPTIONAL filters (can be null/blank)
    // -----------------------------
@AuraEnabled
public static List<Tlearner__c> fetchTLearners(
    Id organizationId,
    String platformValue,
    String roleValue
) {
    if (organizationId == null) return new List<Tlearner__c>();

    String soql =
        'SELECT Id, Title__c, Description__c, AWS_Json__c, Platform__c, Role__c, Expire_Date__c, CreatedDate ' +
        'FROM Tlearner__c ' +
        'WHERE Organization__c = :organizationId ' +
        'AND (Expire_Date__c = NULL OR Expire_Date__c >= TODAY) ';

    if (!String.isBlank(platformValue)) {
        soql += 'AND Platform__c = :platformValue ';
    }
    if (!String.isBlank(roleValue)) {
        soql += 'AND Role__c = :roleValue ';
    }

    soql += 'ORDER BY CreatedDate DESC LIMIT 200';
    return Database.query(soql);
}


    // -----------------------------
    // Organisation combobox options
    // -----------------------------
    public class OrgOption {
        @AuraEnabled public String label;
        @AuraEnabled public String value;
        public OrgOption(String label, String value) {
            this.label = label;
            this.value = value;
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<OrgOption> getOrganisations() {
        List<OrgOption> opts = new List<OrgOption>();

        for (Organisation__c o : [
            SELECT Id, Name
            FROM Organisation__c
            ORDER BY Name
            LIMIT 500
        ]) {
            opts.add(new OrgOption(o.Name, o.Id));
        }
        return opts;
    }
}