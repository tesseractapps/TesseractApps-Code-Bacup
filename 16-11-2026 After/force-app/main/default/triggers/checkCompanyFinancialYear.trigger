trigger checkCompanyFinancialYear on Financial_Year__c (before insert) {
    // Set to collect the Company Names from Trigger.new
    Set<Id> companyId = new Set<Id>();
    
    // Collect the Company Names from Trigger.new (the records being inserted or updated)
    for (Financial_Year__c fy : Trigger.new) {
        System.debug('fy: '+fy);
        System.debug('fy.Company__r.Id: '+fy.Company__c);
        //String companyName = fy.Company__r.Company__c; // Get the Company Name
        System.debug('companyId: '+companyId);
        companyId.add(fy.Company__c); // Add the Company Name to the set
    }
    
    System.debug('companyId: '+companyId);
    // Query for existing Financial Year records with the same Company Name
    List<Financial_Year__c> existingFinancialYears = [
        SELECT Company__r.Company_Name__c
        FROM Financial_Year__c
        WHERE Company__c IN :companyId
    ];
    System.debug('existingFinancialYears: '+existingFinancialYears);
    System.debug('existingFinancialYears: '+existingFinancialYears.size());
    // Create a set to store existing Company Names
    Set<Id> existingCompanyNames = new Set<Id>();
    
    for (Financial_Year__c fy : existingFinancialYears) {
        existingCompanyNames.add(fy.Company__c); // Add the existing Company Names to the set
    }
    System.debug('existingCompanyNames: '+existingCompanyNames);
    // Loop through the new or updated Financial Year records to validate if the Company Name already exists
    for (Financial_Year__c fy : Trigger.new) {
        Id companyName = fy.Company__c;
        System.debug('companyName: '+companyName);
        // If the Company Name already exists in the database, add an error to prevent saving the record
        if (existingCompanyNames.contains(companyName)) {
            System.debug('existingCompanyNames: '+existingCompanyNames);
            fy.addError('Financial Year is already created with this Company Name. Please choose a different Company.');
        }
    }
}