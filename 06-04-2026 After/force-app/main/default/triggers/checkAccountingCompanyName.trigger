trigger checkAccountingCompanyName on Company__c (before insert, before update) {
    Set<String> companyNames = new Set<String>();
    Set<Id> companyIds = new Set<Id>();
    
    // Loop through records being inserted or updated
    for (Company__c company : Trigger.new) {
        companyNames.add(company.Company_Name__c);
        companyIds.add(company.Id);
    }

    // Query for existing organization names in the database
    List<Company__c> existingOrgs = [SELECT Company_Name__c FROM Company__c WHERE Company_Name__c IN :companyNames AND Id NOT IN :companyIds ];
    
    // Create a set to easily check for existing names
    Set<String> existingOrgNames = new Set<String>();
    for (Company__c company : existingOrgs) {
        existingOrgNames.add(company.Company_Name__c);
    }

    // Loop through the records being inserted or updated
    for (Company__c company : Trigger.new) {
        // If the organization name already exists, add an error
        if (existingOrgNames.contains(company.Company_Name__c)) {
            company.addError('The Company Name already exists. Please choose a different name.');
        }
    }
}