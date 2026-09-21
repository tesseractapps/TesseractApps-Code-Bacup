public with sharing class CreateCompanyController {
  
   @AuraEnabled(cacheable=true)
    public static List<Facility__c> getFacility(Id orgidtrack) {
        System.debug('orgidtrack in getFacility: ' + orgidtrack);
    
        // Step 1: Get all company names under this org
        List<Company__c> companies = [SELECT Id, Company_Name__c FROM Company__c WHERE Organization__c = :orgidtrack];
    
        Set<String> companyNames = new Set<String>();
        for (Company__c comp : companies) {
            if (comp.Company_Name__c != null) {
                companyNames.add(comp.Company_Name__c);
            }
        }
    	System.debug('companyNames in getFacility: ' + companyNames);
        // Step 2: Get facilities under the same org
        List<Facility__c> allFacilities = [
            SELECT Id, Name, Facility_Name__c, ABN__c, Address__c, AddressData__c, Email__c, Phone__c, Organisation__c  
            FROM Facility__c 
            WHERE Organisation__c = :orgidtrack AND Status__c = true
        ];
    
        // Step 3: Filter facilities whose names are not in companyNames
        List<Facility__c> unmatchedFacilities = new List<Facility__c>();
        for (Facility__c fac : allFacilities) {
            if (fac.Name != null && !companyNames.contains(fac.Name)) {
                unmatchedFacilities.add(fac);
            }
        }
    
        System.debug('Filtered facilities: ' + JSON.serialize(unmatchedFacilities));
        return unmatchedFacilities;
    }
  
   @AuraEnabled
    public static String insertCompany(String companyId ) {
        System.debug('companyId IN insertCompany: ' + companyId);
       // System.debug('orgidtrack in insertCompany :' + orgidtrack);
    
        // Query for the Facility record based on companyId and orgidtrack
        List<Facility__c> facilityList = [SELECT Id, Name, Facility_Name__c, ABN__c, Address__c, AddressData__c, Email__c, Phone__c, 
                                          Organisation__c, Address__Street__s, Address__City__s, Address__StateCode__s, 
                                          Address__CountryCode__s, Address__PostalCode__s 
                                          FROM Facility__c 
                                          WHERE Id = :companyId];
        
        // Check if the list is empty
        if (facilityList.isEmpty()) {
            System.debug('No Facility record found for the given companyId and orgidtrack');
            throw new AuraHandledException('No Facility record found for the given companyId and orgidtrack');
        }
    
        // Get the first facility record from the list
        Facility__c facility = facilityList[0];
    
        // Create a new Company record and populate fields from the Facility record
        Company__c company = new Company__c(
            Company_Name__c = facility.Name,
            ABN__c = String.valueOf(facility.ABN__c),  // Convert ABN to String if it is a Decimal
            Email__c = facility.Email__c,
            Phone_Number__c = facility.Phone__c,
            Organization__c = facility.Organisation__c,
            Facility__c = facility.Id,
            Address_Latest__Street__s = facility.Address__Street__s,
            Address_Latest__City__s = facility.Address__City__s,
            Address_Latest__StateCode__s = facility.Address__StateCode__s,
            Address_Latest__CountryCode__s = facility.Address__CountryCode__s,
            Address_Latest__PostalCode__s = facility.Address__PostalCode__s
        );
    
        try {
            // Insert the company
            insert company;
    
            System.debug('Company created with ID: ' + company.Id);
    
            // Return the newly created Company ID as a string
            return company.Id;
    
        } catch (Exception e) {
            // Handle the exception and provide feedback
            System.debug('Error creating Company: ' + e.getMessage());
            throw new AuraHandledException('Error creating Company: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static void saveFinancialYearApex(List<String> selectedCompanyIds, String year, String endMonth) {
        System.debug('selectedCompanyIds in saveFinancialYearApex :' + selectedCompanyIds);
        
        List<Financial_Year__c> financialYearsToInsert = new List<Financial_Year__c>();
        
        try {
            // Loop through the list of company IDs and create a Financial Year record for each one
            for (String selectedCompanyId : selectedCompanyIds) {
                Financial_Year__c fy = new Financial_Year__c(
                    Company__c = selectedCompanyId, 
                    Financial_Year__c = year, 
                    End_Month__c = endMonth
                );
                financialYearsToInsert.add(fy);
            }
            
            // Perform a single insert operation to insert all the Financial Year records
            if (!financialYearsToInsert.isEmpty()) {
                insert financialYearsToInsert;
                System.debug('Financial Year records created with IDs: ' + financialYearsToInsert);
            }
            
        } catch (Exception e) {
            System.debug('Error creating Financial Year: ' + e.getMessage());
            throw new AuraHandledException('Error creating Financial Year: ' + e.getMessage());
        }
    }
	
     @AuraEnabled
    public static void saveActivityStatement(String companyId, Map<String, Object> activityStatementData) {
        System.debug('activityStatementData  : ' + JSON.serialize(activityStatementData));
        System.debug('companyId in saveFinancialYearApex :' + companyId);
        List<BAS_and_IAS__c> activityStatementToInsert = new List<BAS_and_IAS__c>();
    
        try {
            BAS_and_IAS__c record = new BAS_and_IAS__c();
            record.Company__c = companyId;
    
            // Set values (only if they exist)
            record.GST_Accounting_Method__c = (String) activityStatementData.get('gstAccountingMethod');
            record.Tax_File_Number__c = (String) activityStatementData.get('taxFileNumber');
            record.GST_Calculation__c = (String) activityStatementData.get('gstCalculation');
            record.PAYG_Withheld_Period__c = (String) activityStatementData.get('paygWithheldPriod'); // Note: Typo in key?
            record.PAYG_Income_Tax_Method__c = (String) activityStatementData.get('paygIncomeTaxMethod');
            record.Fringe_Benefits_Tax__c = (Boolean) activityStatementData.get('isFringeBenefitsTax');
            record.Fuel_Tax_Credits__c = (Boolean) activityStatementData.get('isFuelTaxCredits');
            record.Wine_Equalisation_Tax__c = (Boolean) activityStatementData.get('isWineEqualisationTax');
            record.For_Sales__c = (String) activityStatementData.get('forSales');
            record.For_Purchases__c = (String) activityStatementData.get('forPurchases');
    		record.For_Purchases__c = (String) activityStatementData.get('forPurchases');
            //record.Company__c = (String) activityStatementData.get('companyId');
            activityStatementToInsert.add(record);
    
            if (!activityStatementToInsert.isEmpty()) {
                insert activityStatementToInsert;
                System.debug('Activity Statement record created successfully: ' + record.Id);
            }
        } catch (Exception e) {
            System.debug('Error while saving activity statement: ' + e.getMessage());
            // Optionally: Add error logging or throw a custom exception
        }
    }
	@AuraEnabled(cacheable=true)
    public static List<Company__c> getCompany(String selectedCompany, String orgid) {
        // Initialize a list to hold the result
        List<Company__c> companyData = new List<Company__c>();
        System.debug('selectedCompany: ' +selectedCompany);
           System.debug('orgid: ' +orgid);
        // Build the base SOQL query
        String query = 'SELECT Id, Company_Name__c, Organization__c, ABN__c, Phone_Number__c, Email__c, Fax_Number__c, Tax__c, Address__c ';
        // Conditionally add the FROM clause
        query += 'FROM Company__c ';
        
        // Apply filter based on the provided parameters
        if (selectedCompany != null  && selectedCompany != 'All') {
            // If selectedId is provided, query by the selectedId
            query += 'WHERE Id = :selectedCompany';
        } else if (orgid != null) {
            // If orgid is provided, query by the Organization__c field
            query += 'WHERE Organization__c = :orgid';
        }
        
        // For debugging: output the dynamic query
        System.debug('Dynamic Query: ' + query);
        // Execute the dynamic query
        companyData = Database.query(query);
        // Debugging the result
        System.debug('companyData: ' + JSON.serialize(companyData));
        
        return companyData;
    }

     @AuraEnabled(cacheable=true)
    public static Boolean checkCompanyName(String companyName) {
        System.debug('companyName  in checkCompanyName:' + companyName);
        // Query to check if a company with the same name exists
        Integer companyCount = [SELECT COUNT() FROM Company__c WHERE Company_Name__c = :companyName LIMIT 1];
         System.debug('companyCount  in checkCompanyName:' + companyCount);
        // Return true if the company exists, false otherwise
        return companyCount > 0;
    }
    
    @AuraEnabled(cacheable=true)
    public static Organisation__c getUserOrganisation() {
        // Fetch the current logged-in user's organization name or identifier
        User currentUser = [SELECT Id, Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId()];
        
        // Check if the User has an associated Organisation
        if (String.isNotEmpty(currentUser.Organization_Name__c)) {
            // Fetch the related Organisation record based on the user's stored organization identifier
            Organisation__c orgRecord = [SELECT Id, Name,ABN__c,Contact_Name__c ,Contact_No__c,Email__c, Address_Latest__Street__s,Address_Latest__City__s,Address_Latest__StateCode__s,
                                         Address_Latest__PostalCode__s,Address_Latest__CountryCode__s FROM Organisation__c WHERE Name = :currentUser.Organization_Name__c LIMIT 1];
            return orgRecord;
        }
        return null;
    }
    
   /* @AuraEnabled(cacheable=true)
    public static  Map<String, String>  getProfileId() {
        List<Entity_Profile__c> supplierIds = [SELECT Id, Card_Type__c FROM Entity_Profile__c WHERE Card_Type__c='Supplier'  ORDER BY CreatedDate DESC LIMIT 1];
        List<Entity_Profile__c> customerIds = [SELECT Id, Card_Type__c FROM Entity_Profile__c WHERE Card_Type__c='Customer'  ORDER BY CreatedDate DESC LIMIT 1];
        Map<String, String> result = new Map<String, String>();
        
        if (!supplierIds.isEmpty()) {
            result.put('SupplierId', supplierIds[0].Id);
        }
        if (!customerIds.isEmpty()) {
            result.put('CustomerId', customerIds[0].Id);
        }
        return result;
    }*/
      
   @AuraEnabled(cacheable=true)
    public static Map<String, Object> getProfiles( Id radioCompanyId) {
        Map<String, Object> result = new Map<String, Object>();
        
        // Fetch all profiles in a single SOQL query
        List<Entity_Profile__c> allProfiles = [SELECT Id, Name__c,First_Name__c,Last_Name__c, Card_Type__c, Contact__c,Designation__c, Company__c, Tax_Code__c,AccountList__c FROM Entity_Profile__c WHERE Company__c =:radioCompanyId];
        
        // Separate profiles into categories
        List<Entity_Profile__c> customerProfiles = new List<Entity_Profile__c>();
        List<Entity_Profile__c> supplierProfiles = new List<Entity_Profile__c>();
        
        for (Entity_Profile__c profile : allProfiles) {
            if (profile.Card_Type__c == 'Customer') {
                customerProfiles.add(profile);
            } else if (profile.Card_Type__c == 'Supplier') {
                supplierProfiles.add(profile);
            }
        }
        // Add lists to the result map
        result.put('allProfiles', allProfiles);
        result.put('customerProfiles', customerProfiles);
        result.put('supplierProfiles', supplierProfiles);
        return result;
    }    
   /*  @AuraEnabled(cacheable=true)
    public static List<Map<String, Object>> getAccountList(String industry) {
        List<Map<String, Object>> finalList = new List<Map<String, Object>>();
        
        // Fetch Industry
        List<Industry__c> industries = [SELECT Id, Name FROM Industry__c WHERE Industry__c =: industry LIMIT 1];
        
        Id industryId = industries[0].Id;
        
        // Fetch Categories linked to the Industry
        Map<Id, List<Accounting_Category__c>> categoryMap = new Map<Id, List<Accounting_Category__c>>();
        List<Accounting_Category__c> categories = [SELECT Id, Name, Account_Number__c FROM Accounting_Category__c WHERE Industry_child__c =: industryId];
        for (Accounting_Category__c cat : categories) {
            categoryMap.put(cat.Id, new List<Accounting_Category__c>{cat});
        }
        // Fetch Subcategories linked to Categories
        Map<Id, List<Accounting_Sub_Category__c>> subCategoryMap = new Map<Id, List<Accounting_Sub_Category__c>>();
        for (Accounting_Sub_Category__c sub : [SELECT Id, Name, Account_Number__c, Category__c FROM Accounting_Sub_Category__c WHERE Category__c IN :categoryMap.keySet()]) {
            if (!subCategoryMap.containsKey(sub.Category__c)) {
                subCategoryMap.put(sub.Category__c, new List<Accounting_Sub_Category__c>());
            }
            subCategoryMap.get(sub.Category__c).add(sub);
        }
        
        // Fetch Ledgers linked to Subcategories
        Map<Id, List<Accounting_Ledger_Name__c>> ledgerMap = new Map<Id, List<Accounting_Ledger_Name__c>>();
        for (Accounting_Ledger_Name__c ledger : [SELECT Id, Name, Account_Number__c, Sub_Category__c FROM Accounting_Ledger_Name__c WHERE Sub_Category__c IN :subCategoryMap.keySet()]) {
            if (!ledgerMap.containsKey(ledger.Sub_Category__c)) {
                ledgerMap.put(ledger.Sub_Category__c, new List<Accounting_Ledger_Name__c>());
            }
            ledgerMap.get(ledger.Sub_Category__c).add(ledger);
        }
        
        // Fetch Ledger Items linked to Ledgers
        Map<Id, List<Accounting_Ledger_Items__c>> ledgerItemMap = new Map<Id, List<Accounting_Ledger_Items__c>>();
        for (Accounting_Ledger_Items__c item : [SELECT Id, Name, Account_Number__c, Ledger_Name__c FROM Accounting_Ledger_Items__c WHERE Ledger_Name__c IN :ledgerMap.keySet()]) {
            if (!ledgerItemMap.containsKey(item.Ledger_Name__c)) {
                ledgerItemMap.put(item.Ledger_Name__c, new List<Accounting_Ledger_Items__c>());
            }
            ledgerItemMap.get(item.Ledger_Name__c).add(item);
        }
        // Build Final Structure
        for (Accounting_Category__c cat : categories) {
            Map<String, Object> categoryData = new Map<String, Object>{
                'Id' => cat.Id,
                    'accountNumber' => cat.Account_Number__c,
                    'name' => cat.Name,
                    'subCategories' => new List<Map<String, Object>>() // Ensure 'subCategories' is a List
                    };
                        if (subCategoryMap.containsKey(cat.Id)) {
                            for (Accounting_Sub_Category__c sub : subCategoryMap.get(cat.Id)) {
                                Map<String, Object> subCategoryData = new Map<String, Object>{
                                    'accountNumber' => sub.Account_Number__c,
                                        'name' => sub.Name,
                                        'ledgers' => new List<Map<String, Object>>() // Ensure 'ledgers' is a List
                                        };
                                            if (ledgerMap.containsKey(sub.Id)) {
                                                for (Accounting_Ledger_Name__c ledger : ledgerMap.get(sub.Id)) {
                                                    Map<String, Object> ledgerData = new Map<String, Object>{
                                                        'accountNumber' => ledger.Account_Number__c,
                                                            'name' => ledger.Name,
                                                            'items' => new List<Map<String, Object>>() // Ensure 'items' is a List
                                                            };
                                                                if (ledgerItemMap.containsKey(ledger.Id)) {
                                                                    for (Accounting_Ledger_Items__c item : ledgerItemMap.get(ledger.Id)) {
                                                                        // Add ledger items to 'items' list
                                                                        List<Map<String, Object>> itemsList = (List<Map<String, Object>>) ledgerData.get('items');
                                                                        itemsList.add(new Map<String, Object>{
                                                                            'accountNumber' => item.Account_Number__c,
                                                                                'name' => item.Name
                                                                                });
                                                                    }
                                                                }
                                                    // Add ledgerData to 'ledgers' list inside subCategoryData
                                                    List<Map<String, Object>> ledgersList = (List<Map<String, Object>>) subCategoryData.get('ledgers');
                                                    ledgersList.add(ledgerData);
                                                }
                                            }
                                // Add subCategoryData to 'subCategories' list inside categoryData
                                List<Map<String, Object>> subCategoriesList = (List<Map<String, Object>>) categoryData.get('subCategories');
                                subCategoriesList.add(subCategoryData);
                            }
                        }
            finalList.add(categoryData);
        }
        return finalList;
    }  */
    @AuraEnabled
    public static String insertAccountList(String companyId, String industryId) {
        try {
            // Check if an Account_List__c already exists for the given Company__c
            Integer existingRecords = [
                SELECT COUNT()
                FROM Account_List__c
                WHERE Company__c = :companyId
            ];
            
            // Insert only if no records exist
            if (existingRecords == 0) {
                Account_List__c accList = new Account_List__c();
                accList.Industry__c = industryId;
                accList.Company__c = companyId;
                insert accList;
                return 'Success';
            } else {
                return 'Account List already exists for this company.';
            }
        } catch (Exception e) {
            return 'Error inserting record: ' + e.getMessage();
        }
    }   
    
    @AuraEnabled(cacheable=true)
    public static List<Accounting_Ledger_Items__c> getLedgerItems(Id companyId) {
        String currentUserId = UserInfo.getUserId();
        try {
            User currentUser = [SELECT Id, Organization_Name__c FROM User WHERE Id = :currentUserId LIMIT 1];
            List<Accounting_Ledger_Items__c> ledgerItems = [
                SELECT Id, Name, Account_Number__c, Category__c, Category__r.Name
                FROM Accounting_Ledger_Items__c WHERE Category__r.Accounting_Organisation__r.Name = :currentUser.Organization_Name__c AND Category__r.Company__c = :companyId AND Category__r.Name='Income'
                ORDER BY Name ASC
            ];
            System.debug('Retrieved Ledger Items: ' + JSON.serialize(ledgerItems));
            return ledgerItems;
        } catch (Exception e) {
            System.debug(' Error fetching Ledger Items: ' + e.getMessage());
            throw new AuraHandledException('Error retrieving ledger items: ' + e.getMessage());
        }
    }
    @AuraEnabled
    public static List<Map<String, Object>> getAccountingData(String selectedIndustry) {
         //if (!(selectedIndustry == 'Imp & Exp Org' ||selectedIndustry == 'Service' ||selectedIndustry == 'NDIS' ||selectedIndustry == 'Companies')) {
      if(!(selectedIndustry=='Imp & Exp Org' || selectedIndustry=='NDIS' || selectedIndustry=='Service' || selectedIndustry=='Retail Org' || selectedIndustry=='Manufacturing'|| selectedIndustry=='NFP Org' ||selectedIndustry == 'Companies')) {  
          return new List<Map<String, Object>>();
      } else {
        List<Map<String, Object>> finalList = new List<Map<String, Object>>();
        
        // Category: Assets
        Map<String, Object> category = new Map<String, Object>();
        category.put('accountNumber', '1-0000');
        category.put('name', 'Assets');
        List<Map<String, Object>> subCategories = new List<Map<String, Object>>();
        
        // Subcategory 1: Current Assets
        Map<String, Object> currentAssets = new Map<String, Object>();
        currentAssets.put('accountNumber', '1-1000');
        currentAssets.put('name', 'Current Assets');
        List<Map<String, Object>> ledgers1 = new List<Map<String, Object>>();
        if(selectedIndustry!='Companies') {
         //if(selectedIndustry=='Imp & Exp Org' || selectedIndustry=='NDIS' || selectedIndustry=='Service' || selectedIndustry=='Retail Org' || selectedIndustry=='Manufacturing'|| selectedIndustry=='NFP Org') {
             // Ledger for Current Assets
            Map<String, Object> bankAccounts = new Map<String, Object>();
            bankAccounts.put('accountNumber', '1-1100');
            bankAccounts.put('name', 'Bank Accounts');
            List<Map<String, Object>> items1 = new List<Map<String, Object>>();
            items1.add(new Map<String, Object>{'accountNumber' => '1-1110', 'name' => 'Business Bank Account #1'});
            items1.add(new Map<String, Object>{'accountNumber' => '1-1120', 'name' => 'Business Bank Account #2'});
            items1.add(new Map<String, Object>{'accountNumber' => '1-1130', 'name' => 'Business Bank Account #3'});
            items1.add(new Map<String, Object>{'accountNumber' => '1-1140', 'name' => 'Petty Cash/Cash On Hand'});
            bankAccounts.put('items', items1);
            ledgers1.add(bankAccounts);
            
            // Ledger 2: Clearing Accounts
            Map<String, Object> clearingAccounts = new Map<String, Object>();
            clearingAccounts.put('accountNumber', '1-1200');
            clearingAccounts.put('name', 'Clearing Accounts');
            List<Map<String, Object>> items2 = new List<Map<String, Object>>();
            items2.add(new Map<String, Object>{'accountNumber' => '1-1210', 'name' => 'Undeposited Funds Account'});
            items2.add(new Map<String, Object>{'accountNumber' => '1-1220', 'name' => 'Electronic Clearing Account'});
            items2.add(new Map<String, Object>{'accountNumber' => '1-1230', 'name' => 'Payroll Clearing Account'});
            clearingAccounts.put('items', items2);
            ledgers1.add(clearingAccounts);
            
            // Ledger 3: Other Current Assets
            Map<String, Object> otherCurrentAssets = new Map<String, Object>();
            otherCurrentAssets.put('accountNumber', '1-1300');
            otherCurrentAssets.put('name', 'Other Current Assets');
            List<Map<String, Object>> items3 = new List<Map<String, Object>>();
            items3.add(new Map<String, Object>{'accountNumber' => '1-1310', 'name' => 'Trade Debtors'});
            items3.add(new Map<String, Object>{'accountNumber' => '1-1320', 'name' => 'Inventory'});
            items3.add(new Map<String, Object>{'accountNumber' => '1-1330', 'name' => 'Deposits To Suppliers'});
            items3.add(new Map<String, Object>{'accountNumber' => '1-1340', 'name' => 'Voluntary Withholding Credits'});
            items3.add(new Map<String, Object>{'accountNumber' => '1-1350', 'name' => 'ABN Withholding Credits'});
            items3.add(new Map<String, Object>{'accountNumber' => '1-1360', 'name' => 'Supplier Over Payment'}); /* Added by Vamshi*/
            otherCurrentAssets.put('items', items3);
            ledgers1.add(otherCurrentAssets); 
          
              // Ledger 3: GST Assets
            Map<String, Object> gstAssets = new Map<String, Object>();
            gstAssets.put('accountNumber', '1-1400');
            gstAssets.put('name', 'GST Assets');
            List<Map<String, Object>> gstItems = new List<Map<String, Object>>();
            gstItems.add(new Map<String, Object>{'accountNumber' => '1-1410', 'name' => 'GST Paid'});
            gstAssets.put('items', gstItems);
            ledgers1.add(gstAssets);  
        }
        
        if(selectedIndustry=='NDIS' || selectedIndustry=='Companies'){
              // Ledger 4: Non Profit Trust
            Map<String, Object> nonProfitTrust = new Map<String, Object>();
            nonProfitTrust.put('accountNumber', '1-1500');
            nonProfitTrust.put('name', 'Non Profit Trust');
            List<Map<String, Object>> items15 = new List<Map<String, Object>>();
            items15.add(new Map<String, Object>{'accountNumber' => '1-1510', 'name' => 'Accounts Receivables'});
            items15.add(new Map<String, Object>{'accountNumber' => '1-1520', 'name' => 'Cash on Hand'});
            items15.add(new Map<String, Object>{'accountNumber' => '1-1530', 'name' => 'Cash at Bank - Restricted'});
            items15.add(new Map<String, Object>{'accountNumber' => '1-1540', 'name' => 'Cash at Bank - Unrestricted'});
            items15.add(new Map<String, Object>{'accountNumber' => '1-1550', 'name' => 'Petty Cash'});
            items15.add(new Map<String, Object>{'accountNumber' => '1-1560', 'name' => 'Prepayments'});
            items15.add(new Map<String, Object>{'accountNumber' => '1-1570', 'name' => 'Short-Term Investments'});
            if(selectedIndustry=='Companies'){
               items15.add(new Map<String, Object>{'accountNumber' => '1-1580', 'name' => 'PAYG Instalments'});
               items15.add(new Map<String, Object>{'accountNumber' => '1-1590', 'name' => 'Trade Debtors'}); 
            }
            //items15.add(new Map<String, Object>{'accountNumber' => '1-1480', 'name' => 'Investment Account'});
            //items15.add(new Map<String, Object>{'accountNumber' => '1-1490', 'name' => 'Petty Cash'});
            //items15.add(new Map<String, Object>{'accountNumber' => '1-1490', 'name' => 'Trade Debtors '});
            //items15.add(new Map<String, Object>{'accountNumber' => '1-1500', 'name' => 'Undeposited Funds'});
            //items15.add(new Map<String, Object>{'accountNumber' => '1-1510', 'name' => 'Inventory on Hand'});
            //items15.add(new Map<String, Object>{'accountNumber' => '1-1520', 'name' => 'Other Current Assets'});
            nonProfitTrust.put('items', items15);
            ledgers1.add(nonProfitTrust);
            
              // Ledger :Profitable Trust
            Map<String, Object> profitableTrust = new Map<String, Object>();
            profitableTrust.put('accountNumber', '1-1600');
            profitableTrust.put('name', 'Profitable Trust');
            List<Map<String, Object>> items16 = new List<Map<String, Object>>();
            //items16.add(new Map<String, Object>{'accountNumber' => '1-1610', 'name' => 'Accounts Receivables'});
            //items16.add(new Map<String, Object>{'accountNumber' => '1-1620', 'name' => 'Cash on Hand'});
            //items16.add(new Map<String, Object>{'accountNumber' => '1-1630', 'name' => 'Petty Cash'});
            //items16.add(new Map<String, Object>{'accountNumber' => '1-1640', 'name' => 'Prepayments'});
            //items16.add(new Map<String, Object>{'accountNumber' => '1-1650', 'name' => 'Short-Term Investments'});
            items16.add(new Map<String, Object>{'accountNumber' => '1-1610', 'name' => 'Investment Account'});
            //items15.add(new Map<String, Object>{'accountNumber' => '1-1490', 'name' => 'Petty Cash'});
            //items16.add(new Map<String, Object>{'accountNumber' => '1-1670', 'name' => 'Trade Debtors '});
            items16.add(new Map<String, Object>{'accountNumber' => '1-1620', 'name' => 'Undeposited Funds'});
            items16.add(new Map<String, Object>{'accountNumber' => '1-1630', 'name' => 'Inventory on Hand'});
            items16.add(new Map<String, Object>{'accountNumber' => '1-1640', 'name' => 'Other Current Assets'});
            if(selectedIndustry=='Companies'){
               items16.add(new Map<String, Object>{'accountNumber' => '1-1650', 'name' => 'GST Paid'});  
            }
            profitableTrust.put('items', items16);
            ledgers1.add(profitableTrust);
        }
       
        currentAssets.put('ledgers', ledgers1);
        subCategories.add(currentAssets);
        
        // Subcategory 2: Non-Current Assets
        Map<String, Object> nonCurrentAssets = new Map<String, Object>();
        nonCurrentAssets.put('accountNumber', '1-2000');
        nonCurrentAssets.put('name', 'Non-Current Assets');
        List<Map<String, Object>> ledgers2 = new List<Map<String, Object>>();
        if(selectedIndustry!='Companies') {
        //if(selectedIndustry=='Imp & Exp Org' || selectedIndustry=='NDIS' || selectedIndustry=='Service' || selectedIndustry=='Retail Org' || selectedIndustry=='Manufacturing'|| selectedIndustry=='NFP Org') {
            // Ledger for Non-Current Assets
            Map<String, Object>  plantEquipment = new Map<String, Object>();
            plantEquipment.put('accountNumber', '1-2100');
            plantEquipment.put('name', ' Plant & Equipment');
            List<Map<String, Object>> items4 = new List<Map<String, Object>>();
            items4.add(new Map<String, Object>{'accountNumber' => '1-2110', 'name' => 'Plant & Equipment At Cost'});
            items4.add(new Map<String, Object>{'accountNumber' => '1-2120', 'name' => 'Accum. Depr. Plant & Equipment'});
            plantEquipment.put('items', items4);
            ledgers2.add(plantEquipment);
            
            Map<String, Object>  furniture = new Map<String, Object>();
            furniture.put('accountNumber', '1-2200');
            furniture.put('name', 'Furniture');
            List<Map<String, Object>> items5 = new List<Map<String, Object>>();
            items5.add(new Map<String, Object>{'accountNumber' => '1-2210', 'name' => 'Furniture At Cost'});
            items5.add(new Map<String, Object>{'accountNumber' => '1-2220', 'name' => 'Accum. Depr. Furniture'});
            furniture.put('items', items5);
            ledgers2.add(furniture);
            
            Map<String, Object>  officeEquipment = new Map<String, Object>();
            officeEquipment.put('accountNumber', '1-2300');
            officeEquipment.put('name', 'Office Equipment');
            List<Map<String, Object>> items6 = new List<Map<String, Object>>();
            items6.add(new Map<String, Object>{'accountNumber' => '1-2310', 'name' => 'Office Equipment At Cost'});
            items6.add(new Map<String, Object>{'accountNumber' => '1-2320', 'name' => 'Accum. Depr. Office Equipment'});
            officeEquipment.put('items', items6);
            ledgers2.add(officeEquipment);
            
            Map<String, Object>  computers = new Map<String, Object>();
            computers.put('accountNumber', '1-2400');
            computers.put('name', 'Computers');
            List<Map<String, Object>> items7 = new List<Map<String, Object>>();
            items7.add(new Map<String, Object>{'accountNumber' => '1-2410', 'name' => 'Computers At Cost'});
            items7.add(new Map<String, Object>{'accountNumber' => '1-2420', 'name' => 'Accum. Depr. Computers'});
            computers.put('items', items7);
            ledgers2.add(computers);
            
            Map<String, Object>  motorVehicles = new Map<String, Object>();
            motorVehicles.put('accountNumber', '1-2500');
            motorVehicles.put('name', 'Motor Vehicles');
            List<Map<String, Object>> items8 = new List<Map<String, Object>>();
            items8.add(new Map<String, Object>{'accountNumber' => '1-2510', 'name' => 'Motor Vehicles #1 At Cost'});
            items8.add(new Map<String, Object>{'accountNumber' => '1-2520', 'name' => 'Accum. Depr. Motor Vehicles #1'});
            items8.add(new Map<String, Object>{'accountNumber' => '1-2530', 'name' => 'Motor Vehicles #2 At Cost'});
            items8.add(new Map<String, Object>{'accountNumber' => '1-2540', 'name' => 'Accum. Depr. Motor Vehicles #2'});
            items8.add(new Map<String, Object>{'accountNumber' => '1-2550', 'name' => 'Motor Vehicles #3 At Cost'});
            items8.add(new Map<String, Object>{'accountNumber' => '1-2560', 'name' => 'Accum. Depr. Motor Vehicles #3'});
            motorVehicles.put('items', items8);
            ledgers2.add(motorVehicles);
            
            Map<String, Object>  lowValuePool = new Map<String, Object>();
            lowValuePool.put('accountNumber', '1-2600');
            lowValuePool.put('name', ' Low Value Pool');
            List<Map<String, Object>> items9 = new List<Map<String, Object>>();
            items9.add(new Map<String, Object>{'accountNumber' => '1-2610', 'name' => 'Low Value Pool At Cost'});
            items9.add(new Map<String, Object>{'accountNumber' => '1-2620', 'name' => 'Accum. Depr. Low Value Pool'});
            lowValuePool.put('items', items9);
            ledgers2.add(lowValuePool);
            
            Map<String, Object>  duildings = new Map<String, Object>();
            duildings.put('accountNumber', '1-2700');
            duildings.put('name', 'Buildings');
            List<Map<String, Object>> items10 = new List<Map<String, Object>>();
            items10.add(new Map<String, Object>{'accountNumber' => '1-2710', 'name' => 'Buildings At Cost'});
            items10.add(new Map<String, Object>{'accountNumber' => '1-2720', 'name' => 'Accum. Depr. Buildings'});
            duildings.put('items', items10);
            ledgers2.add(duildings);
            
            Map<String, Object>  warehouseEquipment = new Map<String, Object>();
            warehouseEquipment.put('accountNumber', '1-2800');
            warehouseEquipment.put('name', 'Warehouse Equipment');
            List<Map<String, Object>> items11 = new List<Map<String, Object>>();
            items11.add(new Map<String, Object>{'accountNumber' => '1-2810', 'name' => 'Warehouse Equipment At Cost'});
            items11.add(new Map<String, Object>{'accountNumber' => '1-2820', 'name' => 'Accum. Depr. Warehouse Equip'});
            warehouseEquipment.put('items', items11);
            ledgers2.add(warehouseEquipment);
            
            Map<String, Object>  improvements = new Map<String, Object>();
            improvements.put('accountNumber', '1-2900');
            improvements.put('name', 'Improvements');
            List<Map<String, Object>> items12 = new List<Map<String, Object>>();
            items12.add(new Map<String, Object>{'accountNumber' => '1-2910', 'name' => 'Improvements At Cost'});
            items12.add(new Map<String, Object>{'accountNumber' => '1-2920', 'name' => 'Accum. Depr. Improvements'});
            improvements.put('items', items12);
            ledgers2.add(improvements);
            
            Map<String, Object>   leasedEquipment = new Map<String, Object>();
            leasedEquipment.put('accountNumber', '1-3000');
            leasedEquipment.put('name', ' Leased Equipment');
            List<Map<String, Object>> items13 = new List<Map<String, Object>>();
            items13.add(new Map<String, Object>{'accountNumber' => '1-3010', 'name' => 'Leased Equipment At Cost'});
            items13.add(new Map<String, Object>{'accountNumber' => '1-3020', 'name' => 'Accum. Depr. Leased Equipment'});
            leasedEquipment.put('items', items13);
            ledgers2.add(leasedEquipment);
            
            Map<String, Object>  land = new Map<String, Object>();
            land.put('accountNumber', '1-3100');
            land.put('name', 'Land');
            List<Map<String, Object>> items14 = new List<Map<String, Object>>();
            items14.add(new Map<String, Object>{'accountNumber' => '1-3110', 'name' => 'Land At Cost'});
            land.put('items', items14);
            ledgers2.add(land);
        }    
        if(selectedIndustry=='NDIS' || selectedIndustry=='Companies'){
              // Ledger : Non Profit Trust
            Map<String, Object> nonProfitTrust = new Map<String, Object>();
            nonProfitTrust.put('accountNumber', '1-3200');
            nonProfitTrust.put('name', 'Non Profit Trust');
            List<Map<String, Object>> items17 = new List<Map<String, Object>>();
            items17.add(new Map<String, Object>{'accountNumber' => '1-3210', 'name' => 'Provision for Doubtful Debts'});
            items17.add(new Map<String, Object>{'accountNumber' => '1-3220', 'name' => 'Long-Term Investments'});
            items17.add(new Map<String, Object>{'accountNumber' => '1-3230', 'name' => 'ABN Withholding Credits'});
            items17.add(new Map<String, Object>{'accountNumber' => '1-3240', 'name' => 'Borrowing Costs'});
            items17.add(new Map<String, Object>{'accountNumber' => '1-3250', 'name' => 'Intangibles'});
            //items17.add(new Map<String, Object>{'accountNumber' => '1-3260', 'name' => 'Land'});
            //items17.add(new Map<String, Object>{'accountNumber' => '1-3270', 'name' => 'Buildings'});
            //items17.add(new Map<String, Object>{'accountNumber' => '1-3280', 'name' => 'Accumulated Depreciation on Buildings'});
            //items17.add(new Map<String, Object>{'accountNumber' => '1-3290', 'name' => 'Long-Term Investments'});
            //items17.add(new Map<String, Object>{'accountNumber' => '1-3300', 'name' => 'Loan'});
            //items17.add(new Map<String, Object>{'accountNumber' => '1-3310', 'name' => 'Other Non-Current Assets'});
            nonProfitTrust.put('items', items17);
            ledgers2.add(nonProfitTrust);
            
            // Ledger :Profitable Trust
            Map<String, Object> profitableTrust = new Map<String, Object>();
            profitableTrust.put('accountNumber', '1-3300');
            profitableTrust.put('name', 'Profitable Trust');
            List<Map<String, Object>> items18 = new List<Map<String, Object>>();
            //items18.add(new Map<String, Object>{'accountNumber' => '1-3410', 'name' => 'Provision for Doubtful Debts'});
            //items18.add(new Map<String, Object>{'accountNumber' => '1-3420', 'name' => 'Long-Term Investments'});
           // items18.add(new Map<String, Object>{'accountNumber' => '1-3430', 'name' => 'ABN Withholding Credits'});
           // items18.add(new Map<String, Object>{'accountNumber' => '1-3440', 'name' => 'Borrowing Costs'});
            //items18.add(new Map<String, Object>{'accountNumber' => '1-3450', 'name' => 'Intangibles'});
            items18.add(new Map<String, Object>{'accountNumber' => '1-3310', 'name' => 'Land'});
            items18.add(new Map<String, Object>{'accountNumber' => '1-3320', 'name' => 'Buildings'});
            items18.add(new Map<String, Object>{'accountNumber' => '1-3330', 'name' => 'Accumulated Depreciation on Buildings'});
            items18.add(new Map<String, Object>{'accountNumber' => '1-3340', 'name' => 'Long-Term Investments'});
            items18.add(new Map<String, Object>{'accountNumber' => '1-3350', 'name' => 'Loan'});
            items18.add(new Map<String, Object>{'accountNumber' => '1-3360', 'name' => 'Other Non-Current Assets'});
            profitableTrust.put('items', items18);
            ledgers2.add(profitableTrust);
        }
        
        nonCurrentAssets.put('ledgers', ledgers2);
        subCategories.add(nonCurrentAssets);
       
        if(selectedIndustry=='NDIS' || selectedIndustry=='Companies'){
            // Subcategory : Fixed Assets
            Map<String, Object> fixedAssets = new Map<String, Object>();
            fixedAssets.put('accountNumber', '1-4000');
            fixedAssets.put('name', 'Fixed Assets');
            List<Map<String, Object>> ledgers3 = new List<Map<String, Object>>(); 
            
              // Ledger 4: Non Profit Trust
            Map<String, Object> nonProfitTrust6 = new Map<String, Object>();
            nonProfitTrust6.put('accountNumber', '1-4100');
            nonProfitTrust6.put('name', 'Non Profit Trust');
            List<Map<String, Object>> items23 = new List<Map<String, Object>>();
            items23.add(new Map<String, Object>{'accountNumber' => '1-4110', 'name' => 'Computer Equipment'});
            items23.add(new Map<String, Object>{'accountNumber' => '1-4120', 'name' => 'Computer Equipment - Acc Depre'});
            items23.add(new Map<String, Object>{'accountNumber' => '1-4130', 'name' => 'Furniture & fixtures'});
            items23.add(new Map<String, Object>{'accountNumber' => '1-4140', 'name' => 'Furniture & fixtures- Accum Depre'});
            nonProfitTrust6.put('items', items23);
            ledgers3.add(nonProfitTrust6);
            
              // Ledger :Profitable Trust
            Map<String, Object> profitableTrust6 = new Map<String, Object>();
            profitableTrust6.put('accountNumber', '1-4200');
            profitableTrust6.put('name', 'Profitable Trust');
            List<Map<String, Object>> items24 = new List<Map<String, Object>>();
            items24.add(new Map<String, Object>{'accountNumber' => '1-4210', 'name' => 'Motor Vehicle at cost'});
            items24.add(new Map<String, Object>{'accountNumber' => '1-4220', 'name' => 'Motor Vehicle at cost - Acc Depre'});
            items24.add(new Map<String, Object>{'accountNumber' => '1-4230', 'name' => 'Motor Vehicle at cost - Acc Depre'});
            items24.add(new Map<String, Object>{'accountNumber' => '1-4240', 'name' => 'Office Equipment - Acc Depre'});
            profitableTrust6.put('items', items24);
            ledgers3.add(profitableTrust6);
            
            fixedAssets.put('ledgers', ledgers3);
            subCategories.add(fixedAssets);
        }
       
        
        // Add subcategories to category
        category.put('subCategories', subCategories);
        finalList.add(category);
        
        Map<String, Object> liabilitiesCategory = new Map<String, Object>();
        liabilitiesCategory.put('accountNumber', '2-0000');
        liabilitiesCategory.put('name', 'Liabilities');
        List<Map<String, Object>> liabilitiesSubCategories = new List<Map<String, Object>>();
        
        // Subcategory: Current Liabilities
        Map<String, Object> currentLiabilities = new Map<String, Object>();
        currentLiabilities.put('accountNumber', '2-1000');
        currentLiabilities.put('name', 'Current Liabilities');
        List<Map<String, Object>> currentLiabilitiesLedgers = new List<Map<String, Object>>();
            
        if(selectedIndustry!='Companies') {
        // if(selectedIndustry=='Imp & Exp Org' || selectedIndustry=='NDIS' || selectedIndustry=='Service' || selectedIndustry=='Retail Org' || selectedIndustry=='Manufacturing'|| selectedIndustry=='NFP Org') {
            // Ledger: Short-Term Loans
            Map<String, Object> creditCards = new Map<String, Object>();
            creditCards.put('accountNumber', '2-1100');
            creditCards.put('name', 'Credit Cards');
            List<Map<String, Object>> creditCardsItem = new List<Map<String, Object>>();
            creditCardsItem.add(new Map<String, Object>{'accountNumber' => '2-1110', 'name' => 'Visa #1'});
            creditCardsItem.add(new Map<String, Object>{'accountNumber' => '2-1120', 'name' => 'Mastercard #1'});
            creditCardsItem.add(new Map<String, Object>{'accountNumber' => '2-1130', 'name' => 'AMEX #1'});
            creditCardsItem.add(new Map<String, Object>{'accountNumber' => '2-1140', 'name' => 'Visa #2'});
            creditCardsItem.add(new Map<String, Object>{'accountNumber' => '2-1150', 'name' => 'Mastercard #2'});
            creditCardsItem.add(new Map<String, Object>{'accountNumber' => '2-1160', 'name' => 'AMEX #2'});
            creditCardsItem.add(new Map<String, Object>{'accountNumber' => '2-1170', 'name' => 'Land At Cost'});
            creditCards.put('items', creditCardsItem);
            currentLiabilitiesLedgers.add(creditCards);
            
            Map<String, Object> gSTLiabilities = new Map<String, Object>();
            gSTLiabilities.put('accountNumber', '2-1200');
            gSTLiabilities.put('name', 'GST Liabilities');
            List<Map<String, Object>> gSTLiabilitiesItem = new List<Map<String, Object>>();
            gSTLiabilitiesItem.add(new Map<String, Object>{'accountNumber' => '2-1210', 'name' => 'GST Collected'});
            //gSTLiabilitiesItem.add(new Map<String, Object>{'accountNumber' => '2-1220', 'name' => 'GST Paid'});
            gSTLiabilities.put('items', gSTLiabilitiesItem);
            currentLiabilitiesLedgers.add(gSTLiabilities);
            
            Map<String, Object> otherTax = new Map<String, Object>();
            otherTax.put('accountNumber', '2-1300');
            otherTax.put('name', 'Other Tax/Withholding Liab');
            List<Map<String, Object>> otherTaxItem = new List<Map<String, Object>>();
            otherTaxItem.add(new Map<String, Object>{'accountNumber' => '2-1310', 'name' => 'Voluntary Withholdings Payable'});
            otherTaxItem.add(new Map<String, Object>{'accountNumber' => '2-1320', 'name' => 'ABN Withholdings Payable'});
            otherTaxItem.add(new Map<String, Object>{'accountNumber' => '2-1330', 'name' => 'Company Tax Instal. Payable'});
            otherTaxItem.add(new Map<String, Object>{'accountNumber' => '2-1340', 'name' => 'FBT Instalments Payable'});
            otherTaxItem.add(new Map<String, Object>{'accountNumber' => '2-1350', 'name' => 'Fuel Tax Credits Payable'});
            otherTaxItem.add(new Map<String, Object>{'accountNumber' => '2-1360', 'name' => 'Luxury Car Tax Payable'});
            otherTaxItem.add(new Map<String, Object>{'accountNumber' => '2-1370', 'name' => 'Sales Tax Payable'});
            otherTax.put('items', otherTaxItem);
            currentLiabilitiesLedgers.add(otherTax);
            
            Map<String, Object>  payrollLiabilities = new Map<String, Object>();
            payrollLiabilities.put('accountNumber', '2-1400');
            payrollLiabilities.put('name', ' Payroll Liabilities');
            List<Map<String, Object>> payrollLiabilitiesItem = new List<Map<String, Object>>();
            payrollLiabilitiesItem.add(new Map<String, Object>{'accountNumber' => '2-1410', 'name' => 'PAYG Withholding Payable'});
            payrollLiabilitiesItem.add(new Map<String, Object>{'accountNumber' => '2-1420', 'name' => 'Superannuation Fund #1'});
            payrollLiabilitiesItem.add(new Map<String, Object>{'accountNumber' => '2-1430', 'name' => 'Superannuation Fund #2'});
            payrollLiabilitiesItem.add(new Map<String, Object>{'accountNumber' => '2-1440', 'name' => 'Superannuation Fund #3'});
            payrollLiabilitiesItem.add(new Map<String, Object>{'accountNumber' => '2-1450', 'name' => 'Superannuation Fund #4'});
            payrollLiabilitiesItem.add(new Map<String, Object>{'accountNumber' => '2-1460', 'name' => 'Superannuation Fund #5'});
            payrollLiabilitiesItem.add(new Map<String, Object>{'accountNumber' => '2-1470', 'name' => 'Child Care Payable'});
            payrollLiabilitiesItem.add(new Map<String, Object>{'accountNumber' => '2-1480', 'name' => 'Union Fees Payable'});
            payrollLiabilitiesItem.add(new Map<String, Object>{'accountNumber' => '2-1490', 'name' => 'Other Payroll Liabilities'});
            payrollLiabilities.put('items', payrollLiabilitiesItem);
            currentLiabilitiesLedgers.add(payrollLiabilities);
            
            Map<String, Object>  otherCurrentLiabilities = new Map<String, Object>();
            otherCurrentLiabilities.put('accountNumber', '2-1500');
            otherCurrentLiabilities.put('name', ' Other Current Liabilities');
            List<Map<String, Object>> otherCurrentLiabilitiesItem = new List<Map<String, Object>>();
            otherCurrentLiabilitiesItem.add(new Map<String, Object>{'accountNumber' => '2-1510', 'name' => 'Trade Creditors'});
            otherCurrentLiabilitiesItem.add(new Map<String, Object>{'accountNumber' => '2-1520', 'name' => 'Customer Deposits'});
            otherCurrentLiabilitiesItem.add(new Map<String, Object>{'accountNumber' => '2-1530', 'name' => 'A/P Accrual -Inventory'});
            otherCurrentLiabilitiesItem.add(new Map<String, Object>{'accountNumber' => '2-1540', 'name' => 'Lease On Equipment'});
            otherCurrentLiabilitiesItem.add(new Map<String, Object>{'accountNumber' => '2-1550', 'name' => 'Liability #1'});
            otherCurrentLiabilitiesItem.add(new Map<String, Object>{'accountNumber' => '2-1560', 'name' => 'Liability #2'});
            otherCurrentLiabilitiesItem.add(new Map<String, Object>{'accountNumber' => '2-1570', 'name' => 'Customer Over Payment'}); //Added by Vamshi
            otherCurrentLiabilities.put('items', otherCurrentLiabilitiesItem);
            currentLiabilitiesLedgers.add(otherCurrentLiabilities);
        }
        if(selectedIndustry=='NDIS' || selectedIndustry=='Companies'){
              // Ledger : Non Profit Trust
            Map<String, Object> nonProfitTrust = new Map<String, Object>();
            nonProfitTrust.put('accountNumber', '2-1600');
            nonProfitTrust.put('name', 'Non Profit Trust');
            List<Map<String, Object>> items19 = new List<Map<String, Object>>();
            items19.add(new Map<String, Object>{'accountNumber' => '2-1610', 'name' => 'Accounts Payable'});
            items19.add(new Map<String, Object>{'accountNumber' => '2-1620', 'name' => 'ATO Integrated Client Account'});
            items19.add(new Map<String, Object>{'accountNumber' => '2-1630', 'name' => 'Bank Overdraft'});
            items19.add(new Map<String, Object>{'accountNumber' => '2-1640', 'name' => 'Chattel Mortgage  CL'});
            items19.add(new Map<String, Object>{'accountNumber' => '2-1650', 'name' => 'Hire Purchase Liability CL'});
            items19.add(new Map<String, Object>{'accountNumber' => '2-1660', 'name' => 'GST'});
            items19.add(new Map<String, Object>{'accountNumber' => '2-1670', 'name' => 'Grants Received in Advance'});
            items19.add(new Map<String, Object>{'accountNumber' => '2-1680', 'name' => 'Grants Repayable to Government Departments'});
            items19.add(new Map<String, Object>{'accountNumber' => '2-1690', 'name' => 'Other Current Liabilities'});
            //items19.add(new Map<String, Object>{'accountNumber' => '2-1700', 'name' => 'PAYG Withholdings Payable'});
            //items19.add(new Map<String, Object>{'accountNumber' => '2-1710', 'name' => 'Rounding'});
            //items19.add(new Map<String, Object>{'accountNumber' => '2-1720', 'name' => 'Superannuation Payable'});
            //items19.add(new Map<String, Object>{'accountNumber' => '2-1730', 'name' => 'Suspense'});
            //items19.add(new Map<String, Object>{'accountNumber' => '2-1740', 'name' => 'Trade Creditors '});
            //items19.add(new Map<String, Object>{'accountNumber' => '2-1750', 'name' => 'Unexpired Interest - CL '});
            //items19.add(new Map<String, Object>{'accountNumber' => '2-1760', 'name' => 'Wages Payable'});
            //items19.add(new Map<String, Object>{'accountNumber' => '2-1770', 'name' => 'ABN Withholding Tax Payable'});
            if(selectedIndustry=='Companies'){
               items19.add(new Map<String, Object>{'accountNumber' => '2-1700', 'name' => 'GST Collected'}); 
            }
            nonProfitTrust.put('items', items19);
            currentLiabilitiesLedgers.add(nonProfitTrust);
            
            // Ledger :Profitable Trust
            Map<String, Object> profitableTrust = new Map<String, Object>();
            profitableTrust.put('accountNumber', '2-1800');
            profitableTrust.put('name', 'Profitable Trust');
            List<Map<String, Object>> items20 = new List<Map<String, Object>>();
            //items20.add(new Map<String, Object>{'accountNumber' => '2-1810', 'name' => 'Accounts Payable'});
            //items20.add(new Map<String, Object>{'accountNumber' => '2-1820', 'name' => 'ATO Integrated Client Account'});
            //items20.add(new Map<String, Object>{'accountNumber' => '2-1830', 'name' => 'Bank Overdraft'});
            //items20.add(new Map<String, Object>{'accountNumber' => '2-1840', 'name' => 'Chattel Mortgage  CL'});
            //items20.add(new Map<String, Object>{'accountNumber' => '2-1850', 'name' => 'Hire Purchase Liability CL'});
            //items20.add(new Map<String, Object>{'accountNumber' => '2-1860', 'name' => 'GST'});
            //items20.add(new Map<String, Object>{'accountNumber' => '2-1870', 'name' => 'Grants Received in Advance'});
            //items20.add(new Map<String, Object>{'accountNumber' => '2-1880', 'name' => 'Grants Repayable to Government Departments'});
            //items20.add(new Map<String, Object>{'accountNumber' => '2-1890', 'name' => 'Other Current Liabilities'});
            items20.add(new Map<String, Object>{'accountNumber' => '2-1810', 'name' => 'PAYG Withholdings Payable'});
            items20.add(new Map<String, Object>{'accountNumber' => '2-1820', 'name' => 'Rounding'});
            items20.add(new Map<String, Object>{'accountNumber' => '2-1830', 'name' => 'Superannuation Payable'});
            items20.add(new Map<String, Object>{'accountNumber' => '2-1840', 'name' => 'Suspense'});
            //items20.add(new Map<String, Object>{'accountNumber' => '2-1940', 'name' => 'Trade Creditors '});
            items20.add(new Map<String, Object>{'accountNumber' => '2-1850', 'name' => 'Unexpired Interest - CL '});
            items20.add(new Map<String, Object>{'accountNumber' => '2-1860', 'name' => 'Wages Payable'}); 
            items20.add(new Map<String, Object>{'accountNumber' => '2-1870', 'name' => 'Deferred Income'});
            items20.add(new Map<String, Object>{'accountNumber' => '2-1880', 'name' => 'ABN Withholding Tax Payable'});
            if(selectedIndustry=='Companies'){
               items20.add(new Map<String, Object>{'accountNumber' => '2-1890', 'name' => 'Income Tax Payable'}); 
               items20.add(new Map<String, Object>{'accountNumber' => '2-1900', 'name' => 'Trade Creditors'});   
            }
            profitableTrust.put('items', items20);
            currentLiabilitiesLedgers.add(profitableTrust);
        }
        
        currentLiabilities.put('ledgers', currentLiabilitiesLedgers);
        liabilitiesSubCategories.add(currentLiabilities);
        
        // Subcategory 2: Non-Current Assets
        Map<String, Object>  nonCurrentLiabilities = new Map<String, Object>();
        nonCurrentLiabilities.put('accountNumber', '2-2000');
        nonCurrentLiabilities.put('name', ' Non-Current Liabilities');
        List<Map<String, Object>> nonCurrentLiabilitiesLedgers = new List<Map<String, Object>>();
        
        if(selectedIndustry!='Companies') {
        //if(selectedIndustry=='Imp & Exp Org' || selectedIndustry=='NDIS' || selectedIndustry=='Service' || selectedIndustry=='Retail Org' || selectedIndustry=='Manufacturing'|| selectedIndustry=='NFP Org') {
            // Ledger for Non-Current Assets
            Map<String, Object>  businessLoan1 = new Map<String, Object>();
            businessLoan1.put('accountNumber', '2-2100');
            businessLoan1.put('name', ' Business Loan #1');
            List<Map<String, Object>> businessLoan1items = new List<Map<String, Object>>();
            businessLoan1items.add(new Map<String, Object>{'accountNumber' => '2-2110', 'name' => 'Ledger Item'});
            businessLoan1.put('items', businessLoan1items);
            nonCurrentLiabilitiesLedgers.add(businessLoan1);
            
            Map<String, Object>  businessLoan2 = new Map<String, Object>();
            businessLoan2.put('accountNumber', '2-2200');
            businessLoan2.put('name', ' Business Loan #2');
            List<Map<String, Object>> businessLoan2items = new List<Map<String, Object>>();
            businessLoan2items.add(new Map<String, Object>{'accountNumber' => '2-2210', 'name' => 'Ledger Item'});
            businessLoan2.put('items', businessLoan2items);
            nonCurrentLiabilitiesLedgers.add(businessLoan2);
            
            Map<String, Object>  businessLoan3 = new Map<String, Object>();
            businessLoan3.put('accountNumber', '2-2300');
            businessLoan3.put('name', ' Business Loan #3');
            List<Map<String, Object>> businessLoan3items = new List<Map<String, Object>>();
            businessLoan3items.add(new Map<String, Object>{'accountNumber' => '2-2310', 'name' => 'Ledger Item'});
            businessLoan3.put('items', businessLoan3items);
            nonCurrentLiabilitiesLedgers.add(businessLoan3);
            
            Map<String, Object>  businessLoan4 = new Map<String, Object>();
            businessLoan4.put('accountNumber', '2-2400');
            businessLoan4.put('name', ' Business Loan #4');
            List<Map<String, Object>> businessLoan4items = new List<Map<String, Object>>();
            businessLoan4items.add(new Map<String, Object>{'accountNumber' => '2-2410', 'name' => 'Ledger Item'});
            businessLoan4.put('items', businessLoan4items);
            nonCurrentLiabilitiesLedgers.add(businessLoan4);
        }
        if(selectedIndustry=='NDIS' || selectedIndustry=='Companies'){
              // Ledger : Non Profit Trust
            Map<String, Object> nonProfitTrust = new Map<String, Object>();
            nonProfitTrust.put('accountNumber', '2-2500');
            nonProfitTrust.put('name', 'Non Profit Trust');
            List<Map<String, Object>> items21 = new List<Map<String, Object>>();
            items21.add(new Map<String, Object>{'accountNumber' => '2-2510', 'name' => 'Hire Purchase Liability-  NCL '});
            items21.add(new Map<String, Object>{'accountNumber' => '2-2520', 'name' => 'Loan'});
            items21.add(new Map<String, Object>{'accountNumber' => '2-2530', 'name' => 'Provison for Long Service Leave'});
            items21.add(new Map<String, Object>{'accountNumber' => '2-2540', 'name' => 'Provision for Annual Leave'});
            items21.add(new Map<String, Object>{'accountNumber' => '2-2550', 'name' => 'Other Non-Current Liabilities'});
            //items21.add(new Map<String, Object>{'accountNumber' => '2-2560', 'name' => 'Chattel Mortgage NCL '});
            //items21.add(new Map<String, Object>{'accountNumber' => '2-2570', 'name' => 'Beneficiary Loan'});
            //items21.add(new Map<String, Object>{'accountNumber' => '2-2580', 'name' => 'Other Long Term Liabilities'});
            //items19.add(new Map<String, Object>{'accountNumber' => '2-2500', 'name' => 'Unexpired Interest - NCL '});
            nonProfitTrust.put('items', items21);
            nonCurrentLiabilitiesLedgers.add(nonProfitTrust);
            
            // Ledger :Profitable Trust
            Map<String, Object> profitableTrust = new Map<String, Object>();
            profitableTrust.put('accountNumber', '2-2600');
            profitableTrust.put('name', 'Profitable Trust');
            List<Map<String, Object>> items22 = new List<Map<String, Object>>();
            //items22.add(new Map<String, Object>{'accountNumber' => '2-2510', 'name' => 'Loan '});
            //items22.add(new Map<String, Object>{'accountNumber' => '2-1620', 'name' => 'Other Non-Current Liabilities'});
            //items22.add(new Map<String, Object>{'accountNumber' => '2-1630', 'name' => 'Hire Purchase Liability-  NCL'});
           // items22.add(new Map<String, Object>{'accountNumber' => '2-1640', 'name' => 'Provison for Long Service Leave'});
            //items22.add(new Map<String, Object>{'accountNumber' => '2-1650', 'name' => 'Provision for Annual Leave'});
            items22.add(new Map<String, Object>{'accountNumber' => '2-2610', 'name' => 'Chattel Mortgage NCL'});
            items22.add(new Map<String, Object>{'accountNumber' => '2-2620', 'name' => 'Beneficiary Loan'});
            items22.add(new Map<String, Object>{'accountNumber' => '2-2630', 'name' => 'Other Long Term Liabilities'});
            items22.add(new Map<String, Object>{'accountNumber' => '2-2640', 'name' => 'Unexpired Interest - NCL '});
            if(selectedIndustry=='Companies'){
               items22.add(new Map<String, Object>{'accountNumber' => '2-2650', 'name' => 'Deferred Tax Liabilities'}); 
            }
            profitableTrust.put('items', items22);
            nonCurrentLiabilitiesLedgers.add(profitableTrust);
        }
        
        nonCurrentLiabilities.put('ledgers', nonCurrentLiabilitiesLedgers);
        liabilitiesSubCategories.add(nonCurrentLiabilities);
        liabilitiesCategory.put('subCategories', liabilitiesSubCategories);        
        finalList.add(liabilitiesCategory);
        
        
        Map<String, Object> equityCategory = new Map<String, Object>();
        equityCategory.put('accountNumber', '3-0000');
        equityCategory.put('name', 'Equity');
        List<Map<String, Object>> equitySubCategories = new List<Map<String, Object>>();
        
        if(selectedIndustry=='NDIS' || selectedIndustry=='Companies'){
             // Owner Shareholder Capital
            Map<String, Object> ownersShareholderCapital = new Map<String, Object>();
            ownersShareholderCapital.put('accountNumber', '3-1000');
            ownersShareholderCapital.put('name', 'Owner Shareholder Capital');
            List<Map<String, Object>> ownersShareholderCapitalLedgers = new List<Map<String, Object>>();
            
            Map<String, Object> ownersShareholderCapitalLedger = new Map<String, Object>();
            ownersShareholderCapitalLedger.put('accountNumber', '3-1100');
            ownersShareholderCapitalLedger.put('name', 'Non Profit Trust');
            List<Map<String, Object>> ownersShareholderCapitalItem = new List<Map<String, Object>>();
            ownersShareholderCapitalItem.add(new Map<String, Object>{'accountNumber' => '3-1110', 'name' => 'Asset Revaluation Reserve'});
            ownersShareholderCapitalItem.add(new Map<String, Object>{'accountNumber' => '3-1120', 'name' => 'Trust Distributions Paid'});
            if(selectedIndustry=='Companies'){
               ownersShareholderCapitalItem.add(new Map<String, Object>{'accountNumber' => '3-1130', 'name' => 'Owner/Shareholder Capital'}); 
               ownersShareholderCapitalItem.add(new Map<String, Object>{'accountNumber' => '3-1140', 'name' => 'Issued Capital'}); 
               ownersShareholderCapitalItem.add(new Map<String, Object>{'accountNumber' => '3-1150', 'name' => 'Settlement Sum'});
            }
            ownersShareholderCapitalLedger.put('items', ownersShareholderCapitalItem);
            ownersShareholderCapitalLedgers.add(ownersShareholderCapitalLedger);
            ownersShareholderCapital.put('ledgers', ownersShareholderCapitalLedgers);
            equitySubCategories.add(ownersShareholderCapital);
            
            // Owner Shareholder Drawings
            Map<String, Object> OwnerShareholdeDrawings = new Map<String, Object>();
            OwnerShareholdeDrawings.put('accountNumber', '3-2000');
            OwnerShareholdeDrawings.put('name', 'Owner Shareholder Drawings');
            List<Map<String, Object>> OwnerShareholdeDrawingsLedgers = new List<Map<String, Object>>();
            
            Map<String, Object> ownerShareholdeDrawingsLedger = new Map<String, Object>();
            ownerShareholdeDrawingsLedger.put('accountNumber', '3-2100');
            ownerShareholdeDrawingsLedger.put('name', 'Non Profit Trust');
            List<Map<String, Object>> ownerShareholdeDrawingsItem = new List<Map<String, Object>>();
            ownerShareholdeDrawingsItem.add(new Map<String, Object>{'accountNumber' => '3-2110', 'name' => 'Other Reserves'});
            ownerShareholdeDrawingsItem.add(new Map<String, Object>{'accountNumber' => '3-2120', 'name' => 'Member Contributions '});
            ownerShareholdeDrawingsLedger.put('items', ownerShareholdeDrawingsItem);
            OwnerShareholdeDrawingsLedgers.add(ownerShareholdeDrawingsLedger);
            OwnerShareholdeDrawings.put('ledgers', OwnerShareholdeDrawingsLedgers);
            equitySubCategories.add(OwnerShareholdeDrawings);
            
            // Retained Earnings
            Map<String, Object> retainedEarnings = new Map<String, Object>();
            retainedEarnings.put('accountNumber', '3-3000');
            retainedEarnings.put('name', 'Retained Earnings');
            List<Map<String, Object>> retainedEarningsLedgers = new List<Map<String, Object>>();
            
            Map<String, Object> retainedEarningsLedger = new Map<String, Object>();
            retainedEarningsLedger.put('accountNumber', '3-3100');
            retainedEarningsLedger.put('name', 'Profitable Trust');
            List<Map<String, Object>> retainedEarningsItem = new List<Map<String, Object>>();
            retainedEarningsItem.add(new Map<String, Object>{'accountNumber' => '3-3110', 'name' => 'Retained Earnings'});
            retainedEarningsLedger.put('items', retainedEarningsItem);
            retainedEarningsLedgers.add(retainedEarningsLedger);
            retainedEarnings.put('ledgers', retainedEarningsLedgers);
            equitySubCategories.add(retainedEarnings);
            
            // Current Year Earnings
            Map<String, Object> currentYearEarnings = new Map<String, Object>();
            currentYearEarnings.put('accountNumber', '3-4000');
            currentYearEarnings.put('name', 'Current Year Earnings');
            List<Map<String, Object>> currentYearEarningsLedgers = new List<Map<String, Object>>();
            
            Map<String, Object> currentYearEarningsLedger = new Map<String, Object>();
            currentYearEarningsLedger.put('accountNumber', '3-4100');
            currentYearEarningsLedger.put('name', 'Profitable Trust');
            List<Map<String, Object>> currentYearEarningsItem = new List<Map<String, Object>>();
            currentYearEarningsItem.add(new Map<String, Object>{'accountNumber' => '3-4110', 'name' => 'Current Year Earnings '});
            currentYearEarningsLedger.put('items', currentYearEarningsItem);
            currentYearEarningsLedgers.add(currentYearEarningsLedger);
            currentYearEarnings.put('ledgers', currentYearEarningsLedgers);
            equitySubCategories.add(currentYearEarnings);
            
            // Historical Balancing
            Map<String, Object> historicalBalancing = new Map<String, Object>();
            historicalBalancing.put('accountNumber', '3-5000');
            historicalBalancing.put('name', 'Historical Balancing');
            List<Map<String, Object>> historicalBalancingLedgers = new List<Map<String, Object>>();
            
            Map<String, Object> historicalBalancingLedger = new Map<String, Object>();
            historicalBalancingLedger.put('accountNumber', '3-5100');
            historicalBalancingLedger.put('name', 'Profitable Trust');
            List<Map<String, Object>> historicalBalancingItem = new List<Map<String, Object>>();
            historicalBalancingItem.add(new Map<String, Object>{'accountNumber' => '3-5110', 'name' => 'Historical Balancing'});
            historicalBalancingLedger.put('items', historicalBalancingItem);
            historicalBalancingLedgers.add(historicalBalancingLedger);
            historicalBalancing.put('ledgers', historicalBalancingLedgers);
            equitySubCategories.add(historicalBalancing);
        } else {
           // if(selectedIndustry=='Imp & Exp Org' || selectedIndustry=='Service' || selectedIndustry=='Retail Org' || selectedIndustry=='Manufacturing'|| selectedIndustry=='NFP Org') {
             // Owner Shareholder Capital
            Map<String, Object> ownersShareholderCapital = new Map<String, Object>();
            ownersShareholderCapital.put('accountNumber', '3-1000');
            ownersShareholderCapital.put('name', 'Owner Shareholder Capital');
            List<Map<String, Object>> ownersShareholderCapitalLedgers = new List<Map<String, Object>>();
            
            Map<String, Object> ownersShareholderCapitalLedger = new Map<String, Object>();
            ownersShareholderCapitalLedger.put('accountNumber', '3-1100');
            ownersShareholderCapitalLedger.put('name', 'Ledger Name');
            List<Map<String, Object>> ownersShareholderCapitalItem = new List<Map<String, Object>>();
            ownersShareholderCapitalItem.add(new Map<String, Object>{'accountNumber' => '3-1110', 'name' => 'Ledger Item'});
            ownersShareholderCapitalLedger.put('items', ownersShareholderCapitalItem);
            ownersShareholderCapitalLedgers.add(ownersShareholderCapitalLedger);
                
            ownersShareholderCapital.put('ledgers', ownersShareholderCapitalLedgers);
            equitySubCategories.add(ownersShareholderCapital);
            
            // Owner Shareholder Drawings
            Map<String, Object> OwnerShareholdeDrawings = new Map<String, Object>();
            OwnerShareholdeDrawings.put('accountNumber', '3-2000');
            OwnerShareholdeDrawings.put('name', 'Owner Shareholder Drawings');
            List<Map<String, Object>> OwnerShareholdeDrawingsLedgers = new List<Map<String, Object>>();
            
            Map<String, Object> ownerShareholdeDrawingsLedger = new Map<String, Object>();
            ownerShareholdeDrawingsLedger.put('accountNumber', '3-2100');
            ownerShareholdeDrawingsLedger.put('name', 'Ledger Name');
            List<Map<String, Object>> ownerShareholdeDrawingsItem = new List<Map<String, Object>>();
            ownerShareholdeDrawingsItem.add(new Map<String, Object>{'accountNumber' => '3-2110', 'name' => 'Ledger Item'});
            ownerShareholdeDrawingsLedger.put('items', ownerShareholdeDrawingsItem);
            OwnerShareholdeDrawingsLedgers.add(ownerShareholdeDrawingsLedger);
            OwnerShareholdeDrawings.put('ledgers', OwnerShareholdeDrawingsLedgers);
            equitySubCategories.add(OwnerShareholdeDrawings);
            
            // Retained Earnings
            Map<String, Object> retainedEarnings = new Map<String, Object>();
            retainedEarnings.put('accountNumber', '3-3000');
            retainedEarnings.put('name', 'Retained Earnings');
            List<Map<String, Object>> retainedEarningsLedgers = new List<Map<String, Object>>();
            
            Map<String, Object> retainedEarningsLedger = new Map<String, Object>();
            retainedEarningsLedger.put('accountNumber', '3-3100');
            retainedEarningsLedger.put('name', 'Ledger Name');
            List<Map<String, Object>> retainedEarningsItem = new List<Map<String, Object>>();
            retainedEarningsItem.add(new Map<String, Object>{'accountNumber' => '3-3110', 'name' => 'Ledger Item'});
            retainedEarningsLedger.put('items', retainedEarningsItem);
            retainedEarningsLedgers.add(retainedEarningsLedger);
            retainedEarnings.put('ledgers', retainedEarningsLedgers);
            equitySubCategories.add(retainedEarnings);
            
            // Current Year Earnings
            Map<String, Object> currentYearEarnings = new Map<String, Object>();
            currentYearEarnings.put('accountNumber', '3-4000');
            currentYearEarnings.put('name', 'Current Year Earnings');
            List<Map<String, Object>> currentYearEarningsLedgers = new List<Map<String, Object>>();
            
            Map<String, Object> currentYearEarningsLedger = new Map<String, Object>();
            currentYearEarningsLedger.put('accountNumber', '3-4100');
            currentYearEarningsLedger.put('name', 'Ledger Name');
            List<Map<String, Object>> currentYearEarningsItem = new List<Map<String, Object>>();
            currentYearEarningsItem.add(new Map<String, Object>{'accountNumber' => '3-4110', 'name' => 'Ledger Item'});
            currentYearEarningsLedger.put('items', currentYearEarningsItem);
            currentYearEarningsLedgers.add(currentYearEarningsLedger);
            currentYearEarnings.put('ledgers', currentYearEarningsLedgers);
            equitySubCategories.add(currentYearEarnings);
            
            // Historical Balancing
            Map<String, Object> historicalBalancing = new Map<String, Object>();
            historicalBalancing.put('accountNumber', '3-5000');
            historicalBalancing.put('name', 'Historical Balancing');
            List<Map<String, Object>> historicalBalancingLedgers = new List<Map<String, Object>>();
            
            Map<String, Object> historicalBalancingLedger = new Map<String, Object>();
            historicalBalancingLedger.put('accountNumber', '3-5100');
            historicalBalancingLedger.put('name', 'Ledger Name');
            List<Map<String, Object>> historicalBalancingItem = new List<Map<String, Object>>();
            historicalBalancingItem.add(new Map<String, Object>{'accountNumber' => '3-5110', 'name' => 'Ledger Item'});
            historicalBalancingLedger.put('items', historicalBalancingItem);
            historicalBalancingLedgers.add(historicalBalancingLedger);
            historicalBalancing.put('ledgers', historicalBalancingLedgers);
            equitySubCategories.add(historicalBalancing);   
        }    
        
        // Attach Subcategories to Equity
        equityCategory.put('subCategories', equitySubCategories);        
        finalList.add(equityCategory);
        
        Map<String, Object> incomeCategory = new Map<String, Object>();
        incomeCategory.put('accountNumber', '4-0000');
        incomeCategory.put('name', 'Income');
        List<Map<String, Object>> incomeSubCategories = new List<Map<String, Object>>();
       
        Map<String, Object> salesRevenue = new Map<String, Object>();
        salesRevenue.put('accountNumber', '4-1000');
        salesRevenue.put('name', 'Sales Income');
        List<Map<String, Object>> salesRevenueLedgers = new List<Map<String, Object>>();
        if(selectedIndustry!='Companies') {
         //if(selectedIndustry=='Imp & Exp Org' || selectedIndustry=='NDIS' || selectedIndustry=='Service' || selectedIndustry=='Retail Org' || selectedIndustry=='Manufacturing'|| selectedIndustry=='NFP Org') {
            Map<String, Object> salesRevenueLedger = new Map<String, Object>();
            salesRevenueLedger.put('accountNumber', '4-1100');
            salesRevenueLedger.put('name', 'Ledger Name');
            List<Map<String, Object>> salesRevenueItem = new List<Map<String, Object>>();
            salesRevenueItem.add(new Map<String, Object>{'accountNumber' => '4-1110', 'name' => 'Sales Income #1'});
            salesRevenueItem.add(new Map<String, Object>{'accountNumber' => '4-1120', 'name' => 'Sales Income #2'});
            salesRevenueItem.add(new Map<String, Object>{'accountNumber' => '4-1130', 'name' => 'Sales Income #3'});
            salesRevenueItem.add(new Map<String, Object>{'accountNumber' => '4-1140', 'name' => 'Late Fees Collected'});
            salesRevenueItem.add(new Map<String, Object>{'accountNumber' => '4-1150', 'name' => 'Foreign Sales Income'});
            salesRevenueItem.add(new Map<String, Object>{'accountNumber' => '4-1160', 'name' => 'Freight Income'});
            salesRevenueItem.add(new Map<String, Object>{'accountNumber' => '4-1170', 'name' => 'Fuel Tax Credits'});
            salesRevenueLedger.put('items', salesRevenueItem);
            salesRevenueLedgers.add(salesRevenueLedger);
        }
        if(selectedIndustry=='NDIS' || selectedIndustry=='Companies'){
              // Ledger 4: Non Profit Trust
            Map<String, Object> nonProfitTrust = new Map<String, Object>();
            nonProfitTrust.put('accountNumber', '4-1200');
            nonProfitTrust.put('name', 'Non Profit Trust');
            List<Map<String, Object>> nonProfitTrustItems = new List<Map<String, Object>>();
            nonProfitTrustItems.add(new Map<String, Object>{'accountNumber' => '4-1210', 'name' => 'Interest Income'});
            nonProfitTrustItems.add(new Map<String, Object>{'accountNumber' => '4-1220', 'name' => 'NDIS Service Income'});
            nonProfitTrustItems.add(new Map<String, Object>{'accountNumber' => '4-1230', 'name' => 'NDIS Client Contributions'});
            nonProfitTrustItems.add(new Map<String, Object>{'accountNumber' => '4-1240', 'name' => 'NDIS Therapy Services '});
            nonProfitTrustItems.add(new Map<String, Object>{'accountNumber' => '4-1250', 'name' => 'NDIS Support Coordination'});
            nonProfitTrustItems.add(new Map<String, Object>{'accountNumber' => '4-1260', 'name' => 'Grants'});
            //nonProfitTrustItems.add(new Map<String, Object>{'accountNumber' => '4-1270', 'name' => 'Donations received'});
            nonProfitTrustItems.add(new Map<String, Object>{'accountNumber' => '4-1270', 'name' => 'Fundraising Gifts'});
            nonProfitTrustItems.add(new Map<String, Object>{'accountNumber' => '4-1280', 'name' => 'Fundraising - Contributions - Members'});
            nonProfitTrustItems.add(new Map<String, Object>{'accountNumber' => '4-1290', 'name' => 'Fundraising - Contributions - Public'});
            nonProfitTrustItems.add(new Map<String, Object>{'accountNumber' => '4-1300', 'name' => 'Fundraising - Contributions - Government'});
            nonProfitTrustItems.add(new Map<String, Object>{'accountNumber' => '4-1310', 'name' => 'Sponsorship and licensing fees'});
            nonProfitTrust.put('items', nonProfitTrustItems);
            salesRevenueLedgers.add(nonProfitTrust);
            
              // Ledger :Profitable Trust
            Map<String, Object> profitableTrust = new Map<String, Object>();
            profitableTrust.put('accountNumber', '4-1400');
            profitableTrust.put('name', 'Profitable Trust');
            List<Map<String, Object>> ProfitableTrustItems = new List<Map<String, Object>>();
            ProfitableTrustItems.add(new Map<String, Object>{'accountNumber' => '4-1410', 'name' => 'Government Grants (Other than NDIS)'});
            ProfitableTrustItems.add(new Map<String, Object>{'accountNumber' => '4-1420', 'name' => 'Donations received'});
            ProfitableTrustItems.add(new Map<String, Object>{'accountNumber' => '4-1430', 'name' => 'Fundraising '});
            ProfitableTrustItems.add(new Map<String, Object>{'accountNumber' => '4-1440', 'name' => 'Rental income'});
            ProfitableTrustItems.add(new Map<String, Object>{'accountNumber' => '4-1450', 'name' => 'Membership Fees'});
            ProfitableTrustItems.add(new Map<String, Object>{'accountNumber' => '4-1460', 'name' => 'Dividends Received'});
            ProfitableTrustItems.add(new Map<String, Object>{'accountNumber' => '4-1470', 'name' => 'Special Events'});
            ProfitableTrustItems.add(new Map<String, Object>{'accountNumber' => '4-1480', 'name' => 'Sales of tickets'});
            ProfitableTrustItems.add(new Map<String, Object>{'accountNumber' => '4-1490', 'name' => 'Gain on Sale of Non- Current Assets'});
            ProfitableTrustItems.add(new Map<String, Object>{'accountNumber' => '4-1500', 'name' => 'Other Revenue'});
            ProfitableTrustItems.add(new Map<String, Object>{'accountNumber' => '4-1510', 'name' => 'Sale of Goods'});
            if(selectedIndustry=='Companies'){
               ProfitableTrustItems.add(new Map<String, Object>{'accountNumber' => '4-1520', 'name' => 'NDIS Funding'}); 
            }
            profitableTrust.put('items', ProfitableTrustItems);
            salesRevenueLedgers.add(profitableTrust);
          
        }
        salesRevenue.put('ledgers', salesRevenueLedgers);
        incomeSubCategories.add(salesRevenue);
        
        if(selectedIndustry=='NDIS' || selectedIndustry=='Companies'){
            // Subcategory : Realised Currency Gains
            Map<String, Object> realisedCurrencyGains = new Map<String, Object>();
            realisedCurrencyGains.put('accountNumber', '4-2000');
            realisedCurrencyGains.put('name', 'Realised Currency Gains');
            List<Map<String, Object>> ledgers5 = new List<Map<String, Object>>(); 
            
              // Ledger 4: Non Profit Trust
            Map<String, Object> nonProfitTrust8 = new Map<String, Object>();
            nonProfitTrust8.put('accountNumber', '4-2100');
            nonProfitTrust8.put('name', 'Non Profit Trust');
            List<Map<String, Object>> items25 = new List<Map<String, Object>>();
            items25.add(new Map<String, Object>{'accountNumber' => '4-2110', 'name' => 'Realised Currency Gains'});
            nonProfitTrust8.put('items', items25);
            ledgers5.add(nonProfitTrust8);
            
            realisedCurrencyGains.put('ledgers', ledgers5);
            incomeSubCategories.add(realisedCurrencyGains);
        }
       
        incomeCategory.put('subCategories', incomeSubCategories);
        finalList.add(incomeCategory);
        if(selectedIndustry!='Companies') {
         //if(selectedIndustry=='Imp & Exp Org' || selectedIndustry=='NDIS' || selectedIndustry=='Service' || selectedIndustry=='Retail Org' || selectedIndustry=='Manufacturing'|| selectedIndustry=='NFP Org') {
            Map<String, Object> costOfSalesCategory = new Map<String, Object>();
            costOfSalesCategory.put('accountNumber', '5-0000');
            costOfSalesCategory.put('name', 'Cost Of Goods sold');
            List<Map<String, Object>> costOfSalesSubCategories = new List<Map<String, Object>>();
            
            String[] subCategories1 = new String[]{
                '5-1000:Cost Of Goods sold',
                    '5-2000:Consumables',
                    '5-3000:Plant/Equipment Hire',
                    '5-4000:Direct Labour',
                    '5-5000:Freight In',
                    '5-6000:Discounts Received',
                    '5-7000:Late Fees Paid',
                    '5-8000:Purchase Returns',
                    '5-9000:Packaging'
                    };
                        
                        for (String subCategory1 : subCategories1) {
                            List<String> parts = subCategory1.split(':');
                            Map<String, Object> subCat = new Map<String, Object>();
                            subCat.put('accountNumber', parts[0]);
                            subCat.put('name', parts[1]);
                            
                            List<Map<String, Object>> ledgers = new List<Map<String, Object>>();
                            Map<String, Object> ledger = new Map<String, Object>();
                            ledger.put('accountNumber', parts[0].replace('000', '100'));
                            ledger.put('name', 'Ledger Name');
                            
                            List<Map<String, Object>> items = new List<Map<String, Object>>();
                            Map<String, Object> item = new Map<String, Object>();
                            item.put('accountNumber', parts[0].replace('000', '110'));
                            item.put('name', 'Ledger Item');
                            items.add(item);
                            
                            ledger.put('items', items);
                            ledgers.add(ledger);
                            subCat.put('ledgers', ledgers);
                            
                            costOfSalesSubCategories.add(subCat);
                        }
            
            costOfSalesCategory.put('subCategories', costOfSalesSubCategories);
            finalList.add(costOfSalesCategory);
        }
        Map<String, Object> expensesCategory = new Map<String, Object>();
        expensesCategory.put('accountNumber', '6-0000');
        expensesCategory.put('name', 'Expenses');
        List<Map<String, Object>> expensesSubCategories = new List<Map<String, Object>>();
        
        Map<String, Object> generalExpenses = new Map<String, Object>();
        generalExpenses.put('accountNumber', '6-1000');
        generalExpenses.put('name', 'General Expenses');
        List<Map<String, Object>> generalExpensesLedgers = new List<Map<String, Object>>();
        if(selectedIndustry!='Companies') {
         //if(selectedIndustry=='Imp & Exp Org' || selectedIndustry=='NDIS' || selectedIndustry=='Service' || selectedIndustry=='Retail Org' || selectedIndustry=='Manufacturing'|| selectedIndustry=='NFP Org') {
            Map<String, Object> generalExpensesLedgerName = new Map<String, Object>();
            generalExpensesLedgerName.put('accountNumber', '6-1100');
            generalExpensesLedgerName.put('name', 'General Expenses');
            List<Map<String, Object>> generalExpensesItem = new List<Map<String, Object>>();
            generalExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-1110', 'name' => 'Accounting/Bookeeping Fees'});
            generalExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-1120', 'name' => 'Advertising & Marketing'});
            generalExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-1130', 'name' => 'Bank Fees'});
            generalExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-1140', 'name' => 'Borrowing Expenses'});
            generalExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-1150', 'name' => 'Bad Debts'});
            generalExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-1160', 'name' => 'Cleaning Expenses'});
            generalExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-1170', 'name' => 'Electricity Expenses'});
            generalExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-1180', 'name' => 'Gas Expenses'});
            generalExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-1190', 'name' => 'Legal Fees'});
            generalExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-1200', 'name' => 'Telephone Expenses'});
            generalExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-1210', 'name' => 'Parking/Tolls Expenses'});
            generalExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-1220', 'name' => 'Equip. Repairs & Maintenance'});
            generalExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-1230', 'name' => 'General Repairs & Maintenance'});
            generalExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-1240', 'name' => 'Internet'});
            generalExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-1250', 'name' => 'Computer Expenses'});
            generalExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-1260', 'name' => 'Council Rates'});
            generalExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-1270', 'name' => 'Water Expenses'});
            generalExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-1280', 'name' => 'Stationery'});
            generalExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-1290', 'name' => 'Printing'});
            generalExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-1300', 'name' => 'Waste Removal'});
            generalExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-1310', 'name' => 'Freight Out'});
            generalExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-1320', 'name' => 'Postage'});
            generalExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-1330', 'name' => 'Inv. Adj. Shrinkage/Spoilage'});
            generalExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-1340', 'name' => 'Discounts Given'});
            generalExpensesLedgerName.put('items', generalExpensesItem);
            generalExpensesLedgers.add(generalExpensesLedgerName);
        }
        if(selectedIndustry=='NDIS' || selectedIndustry=='Companies'){
              // Ledger 4: Non Profit Trust
            Map<String, Object> nonProfitTrust1 = new Map<String, Object>();
            nonProfitTrust1.put('accountNumber', '6-1400');
            nonProfitTrust1.put('name', 'Non Profit Trust');
            List<Map<String, Object>> nonProfitTrustItems1 = new List<Map<String, Object>>();
            nonProfitTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1410', 'name' => 'Accounting Fees'});
            nonProfitTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1420', 'name' => 'Amortisation Expense'});
            nonProfitTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1430', 'name' => 'Assets Purchased  <$300.00'});
            nonProfitTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1440', 'name' => 'Audit Fees'});
            nonProfitTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1450', 'name' => 'Board/Governance Expenses'});
            nonProfitTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1460', 'name' => 'Client Support Services'});
            nonProfitTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1470', 'name' => 'Consultancy Fees'});
            nonProfitTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1480', 'name' => 'Credit Card Fees'});
            //nonProfitTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1490', 'name' => 'Depreciation'});
            nonProfitTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1490', 'name' => 'Donations'});
            nonProfitTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1500', 'name' => 'Filing Fees'});
            nonProfitTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1510', 'name' => 'Fines & Penalties'});
            nonProfitTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1520', 'name' => 'Fees & Permits'});
            nonProfitTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1530', 'name' => 'Fundraising Expense'});
            nonProfitTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1540', 'name' => 'Employment Support and Supervision Costs'});
            nonProfitTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1550', 'name' => 'Entertainment Costs'});
            nonProfitTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1560', 'name' => 'Health & Safety'});
            nonProfitTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1570', 'name' => 'General Expenses'});
            nonProfitTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1580', 'name' => 'Hire Purchase Charges'});
            nonProfitTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1590', 'name' => 'Subcontractor Expenses'});
            nonProfitTrust1.put('items', nonProfitTrustItems1);
            generalExpensesLedgers.add(nonProfitTrust1);
            
              // Ledger :Profitable Trust
            Map<String, Object> profitableTrust1 = new Map<String, Object>();
            profitableTrust1.put('accountNumber', '6-1600');
            profitableTrust1.put('name', 'Profitable Trust');
            List<Map<String, Object>> ProfitableTrustItems1 = new List<Map<String, Object>>();
            //ProfitableTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1610', 'name' => 'Insurance'});
            ProfitableTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1610', 'name' => 'Interest Expense '});
            ProfitableTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1620', 'name' => 'Loss on Sale of Assets'});
            ProfitableTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1630', 'name' => 'Light, Power, Heating'});
            ProfitableTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1640', 'name' => 'Management Fees'});
            ProfitableTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1650', 'name' => 'Meeting Expense'});
            ProfitableTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1660', 'name' => 'Membership Fees Paid'});
            ProfitableTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1670', 'name' => 'Merchant Fees'});
            ProfitableTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1680', 'name' => 'Office Supplies'});
            ProfitableTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1690', 'name' => 'Postage, Freight and Courier'});
            ProfitableTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1700', 'name' => 'Printing & Stationery'});
            ProfitableTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1710', 'name' => 'Property Management Fees'});
            ProfitableTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1720', 'name' => 'Publications and Information Resources'});
            ProfitableTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1730', 'name' => 'Rates & Taxes'});
            ProfitableTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1740', 'name' => 'Rent'});
            ProfitableTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1750', 'name' => 'Repairs & Maintenance'});
            ProfitableTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1760', 'name' => 'Subscriptions & Memberships'});
            ProfitableTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1770', 'name' => 'Tenancy and Property Supplies and Services'});
            ProfitableTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1780', 'name' => 'Sundry Expenses'});
            ProfitableTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1790', 'name' => 'Staff Amenities'});
            ProfitableTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1800', 'name' => 'Service Subcontractors'});
            ProfitableTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1810', 'name' => 'Telephone and internet'});
            ProfitableTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1820', 'name' => 'Travel - International'});
            //ProfitableTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1930', 'name' => 'Workers\' Compensation'});
            
            profitableTrust1.put('items', ProfitableTrustItems1);
            generalExpensesLedgers.add(profitableTrust1);
          
        }
        generalExpenses.put('ledgers', generalExpensesLedgers);
        expensesSubCategories.add(generalExpenses);
        
        if(selectedIndustry=='NDIS' || selectedIndustry=='Companies'){
            // Subcategory : Cost of Goods Sold
            Map<String, Object> costOfGoodsSold = new Map<String, Object>();
            costOfGoodsSold.put('accountNumber', '6-3000');
            costOfGoodsSold.put('name', 'Cost of Goods Sold');
            List<Map<String, Object>> ledgers4 = new List<Map<String, Object>>(); 
            
              // Ledger 4: Non Profit Trust
            Map<String, Object> nonProfitTrust7 = new Map<String, Object>();
            nonProfitTrust7.put('accountNumber', '6-3100');
            nonProfitTrust7.put('name', 'Non Profit Trust');
            List<Map<String, Object>> items25 = new List<Map<String, Object>>();
            items25.add(new Map<String, Object>{'accountNumber' => '6-3110', 'name' => 'Purchases'});
            items25.add(new Map<String, Object>{'accountNumber' => '6-3120', 'name' => 'Opening Stock'});
            nonProfitTrust7.put('items', items25);
            ledgers4.add(nonProfitTrust7);
            
              // Ledger :Profitable Trust
            Map<String, Object> profitableTrust7 = new Map<String, Object>();
            profitableTrust7.put('accountNumber', '6-3200');
            profitableTrust7.put('name', 'Profitable Trust');
            List<Map<String, Object>> items26 = new List<Map<String, Object>>();
            items26.add(new Map<String, Object>{'accountNumber' => '6-3210', 'name' => 'Fright Inwards'});
            items26.add(new Map<String, Object>{'accountNumber' => '6-3220', 'name' => 'Less: Closing Stock'});
            profitableTrust7.put('items', items26);
            ledgers4.add(profitableTrust7);
            
            costOfGoodsSold.put('ledgers', ledgers4);
            expensesSubCategories.add(costOfGoodsSold);
        }
        
        Map<String, Object> payrollExpenses = new Map<String, Object>();
        payrollExpenses.put('accountNumber', '6-4000');
        payrollExpenses.put('name', 'Payroll Expenses');
        List<Map<String, Object>> payrollExpensesLedgers = new List<Map<String, Object>>();
        if(selectedIndustry!='Companies') {
         //if(selectedIndustry=='Imp & Exp Org' || selectedIndustry=='NDIS' || selectedIndustry=='Service' || selectedIndustry=='Retail Org' || selectedIndustry=='Manufacturing'|| selectedIndustry=='NFP Org') {
            Map<String, Object> wagesSalariesExpenses = new Map<String, Object>();
            wagesSalariesExpenses.put('accountNumber', '6-4100');
            wagesSalariesExpenses.put('name', 'Wages & Salaries Expenses');
            List<Map<String, Object>> wagesSalariesExpensesItem = new List<Map<String, Object>>();
            wagesSalariesExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-4110', 'name' => 'Work Cover Premiums'});
            wagesSalariesExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-4120', 'name' => 'Superannuation Expenses'});
            wagesSalariesExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-4130', 'name' => 'Uniforms'});
            wagesSalariesExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-4140', 'name' => 'Staff Training Expenses'});
            wagesSalariesExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-4150', 'name' => 'Director\'s Fees'});
            wagesSalariesExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-4160', 'name' => 'Travel & Accom. Expenses'});
            wagesSalariesExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-4170', 'name' => 'Food'});
            wagesSalariesExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-4180', 'name' => 'Mobile Phone Expenses'});
            wagesSalariesExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-4190', 'name' => 'Other Payroll Expenses'});
            wagesSalariesExpenses.put('items', wagesSalariesExpensesItem);
            payrollExpensesLedgers.add(wagesSalariesExpenses);
        }
        if(selectedIndustry=='NDIS' || selectedIndustry=='Companies'){
              // Ledger 4: Non Profit Trust
            Map<String, Object> nonProfitTrust2 = new Map<String, Object>();
            nonProfitTrust2.put('accountNumber', '6-4200');
            nonProfitTrust2.put('name', 'Non Profit Trust');
            List<Map<String, Object>> nonProfitTrustItems2 = new List<Map<String, Object>>();
            nonProfitTrustItems2.add(new Map<String, Object>{'accountNumber' => '6-4210', 'name' => 'Annual Leave Expenses'});
            nonProfitTrustItems2.add(new Map<String, Object>{'accountNumber' => '6-4220', 'name' => 'Long Service Leave Expenses'});
            nonProfitTrustItems2.add(new Map<String, Object>{'accountNumber' => '6-4230', 'name' => 'Recruitment Expense'});
            nonProfitTrustItems2.add(new Map<String, Object>{'accountNumber' => '6-4240', 'name' => 'IT and Software Licenses'});
            if(selectedIndustry=='Companies'){
               nonProfitTrustItems2.add(new Map<String, Object>{'accountNumber' => '6-4250', 'name' => 'Software Licenses'}); 
               nonProfitTrustItems2.add(new Map<String, Object>{'accountNumber' => '6-4260', 'name' => 'Income Tax Expense'}); 
            }
            nonProfitTrust2.put('items', nonProfitTrustItems2);
            payrollExpensesLedgers.add(nonProfitTrust2);
            
              // Ledger :Profitable Trust
            Map<String, Object> profitableTrust2 = new Map<String, Object>();
            profitableTrust2.put('accountNumber', '6-4300');
            profitableTrust2.put('name', 'Profitable Trust');
            List<Map<String, Object>> ProfitableTrustItems2 = new List<Map<String, Object>>();
            //ProfitableTrustItems1.add(new Map<String, Object>{'accountNumber' => '6-1610', 'name' => 'Insurance'});
            ProfitableTrustItems2.add(new Map<String, Object>{'accountNumber' => '6-4310', 'name' => 'Termination Payments '});
            ProfitableTrustItems2.add(new Map<String, Object>{'accountNumber' => '6-4320', 'name' => 'Workers\' Compensation'});
            ProfitableTrustItems2.add(new Map<String, Object>{'accountNumber' => '6-4330', 'name' => 'Training & Development'});
            ProfitableTrustItems2.add(new Map<String, Object>{'accountNumber' => '6-4340', 'name' => 'Wages & Salaries'});
            
            profitableTrust2.put('items', ProfitableTrustItems2);
            payrollExpensesLedgers.add(profitableTrust2);
          
        }
        payrollExpenses.put('ledgers', payrollExpensesLedgers);
        expensesSubCategories.add(payrollExpenses);

        Map<String, Object> depreciationExpenses = new Map<String, Object>();
        depreciationExpenses.put('accountNumber', '6-6000');
        depreciationExpenses.put('name', 'Depreciation Expenses');
        List<Map<String, Object>> depreciationExpensesLedgers = new List<Map<String, Object>>();
        if(selectedIndustry!='Companies') {
        //if(selectedIndustry=='Imp & Exp Org' || selectedIndustry=='NDIS' || selectedIndustry=='Service' || selectedIndustry=='Retail Org' || selectedIndustry=='Manufacturing'|| selectedIndustry=='NFP Org') {
            Map<String, Object> plantDepreciation = new Map<String, Object>();
            plantDepreciation.put('accountNumber', '6-6100');
            plantDepreciation.put('name', 'Plant Depreciation');
            List<Map<String, Object>> plantDepreciationExpensesItem = new List<Map<String, Object>>();
            plantDepreciationExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-6110', 'name' => 'Furniture Depreciation'});
            plantDepreciationExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-6120', 'name' => 'Office Equipment Depreciation'});
            plantDepreciationExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-6130', 'name' => 'Computer Depreciation'});
            plantDepreciationExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-6140', 'name' => 'Motor Vehicle Depreciation #1'});
            plantDepreciationExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-6150', 'name' => 'Motor Vehicle Depreciation #2'});
            plantDepreciationExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-6160', 'name' => 'Motor Vehicle Depreciation #3'});
            plantDepreciationExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-6170', 'name' => 'Low Value Pool Depreciation'});
            plantDepreciationExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-6180', 'name' => 'Buildings Depreciation'});
            plantDepreciationExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-6190', 'name' => 'Warehouse Equip. Depreciation'});
            plantDepreciationExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-6200', 'name' => 'Improvements Depreciation'});
            plantDepreciationExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-6210', 'name' => 'Leased Equipment Depreciation'});
            plantDepreciation.put('items', plantDepreciationExpensesItem);
            depreciationExpensesLedgers.add(plantDepreciation);
        }
        if(selectedIndustry=='NDIS' || selectedIndustry=='Companies'){
              // Ledger 4: Non Profit Trust
            Map<String, Object> nonProfitTrust3 = new Map<String, Object>();
            nonProfitTrust3.put('accountNumber', '6-6300');
            nonProfitTrust3.put('name', 'Non Profit Trust');
            List<Map<String, Object>> nonProfitTrustItems3 = new List<Map<String, Object>>();
            nonProfitTrustItems3.add(new Map<String, Object>{'accountNumber' => '6-6310', 'name' => 'Depreciation'});
           
            nonProfitTrust3.put('items', nonProfitTrustItems3);
            depreciationExpensesLedgers.add(nonProfitTrust3);
            
        }
        depreciationExpenses.put('ledgers', depreciationExpensesLedgers);
        expensesSubCategories.add(depreciationExpenses);
        
        Map<String, Object> motorVehicleExpenses = new Map<String, Object>();
        motorVehicleExpenses.put('accountNumber', '6-8000');
        motorVehicleExpenses.put('name', 'Motor Vehicle Expenses');
        List<Map<String, Object>> motorVehicleExpensesLedgers = new List<Map<String, Object>>();
        if(selectedIndustry!='Companies') {
        //if(selectedIndustry=='Imp & Exp Org' || selectedIndustry=='NDIS' || selectedIndustry=='Service' || selectedIndustry=='Retail Org' || selectedIndustry=='Manufacturing'|| selectedIndustry=='NFP Org') {
            Map<String, Object> motorVehicleRegistration = new Map<String, Object>();
            motorVehicleRegistration.put('accountNumber', '6-8100');
            motorVehicleRegistration.put('name', 'Motor Vehicle Registration');
            List<Map<String, Object>> motorVehicleExpensesItem = new List<Map<String, Object>>();
            motorVehicleExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-8110', 'name' => 'Motor Vehicle Insurance'});
            motorVehicleExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-8120', 'name' => 'Motor Vehicle Fuel/Oil'});
            motorVehicleExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-8130', 'name' => 'Motor Vehicle Maintenance'});
            motorVehicleRegistration.put('items', motorVehicleExpensesItem);
            motorVehicleExpensesLedgers.add(motorVehicleRegistration);
        }
        if(selectedIndustry=='NDIS' || selectedIndustry=='Companies'){
              // Ledger 4: Non Profit Trust
            Map<String, Object> nonProfitTrust4 = new Map<String, Object>();
            nonProfitTrust4.put('accountNumber', '6-8200');
            nonProfitTrust4.put('name', 'Non Profit Trust');
            List<Map<String, Object>> nonProfitTrustItems4 = new List<Map<String, Object>>();
            nonProfitTrustItems4.add(new Map<String, Object>{'accountNumber' => '6-8210', 'name' => 'Motor Vehicle Expense - Registration & Insurance'});
            nonProfitTrustItems4.add(new Map<String, Object>{'accountNumber' => '6-8220', 'name' => 'Motor Vehicle Expense - Repairs & Maintenance'});
           
            nonProfitTrust4.put('items', nonProfitTrustItems4);
            motorVehicleExpensesLedgers.add(nonProfitTrust4);
            
              // Ledger :Profitable Trust
            Map<String, Object> profitableTrust4 = new Map<String, Object>();
            profitableTrust4.put('accountNumber', '6-8300');
            profitableTrust4.put('name', 'Profitable Trust');
            List<Map<String, Object>> ProfitableTrustItems4 = new List<Map<String, Object>>();
            ProfitableTrustItems4.add(new Map<String, Object>{'accountNumber' => '6-8310', 'name' => 'Motor Vehicle Expense - Lease Payments '});
            profitableTrust4.put('items', ProfitableTrustItems4);
            motorVehicleExpensesLedgers.add(profitableTrust4);
          
        }
        motorVehicleExpenses.put('ledgers', motorVehicleExpensesLedgers);
        expensesSubCategories.add(motorVehicleExpenses);

		Map<String, Object> insuranceExpenses = new Map<String, Object>();
        insuranceExpenses.put('accountNumber', '6-9000');
        insuranceExpenses.put('name', 'Insurance Expenses');
        List<Map<String, Object>> insuranceExpensesLedgers = new List<Map<String, Object>>();
        if(selectedIndustry!='Companies') {
        //if(selectedIndustry=='Imp & Exp Org' || selectedIndustry=='NDIS' || selectedIndustry=='Service' || selectedIndustry=='Retail Org' || selectedIndustry=='Manufacturing'|| selectedIndustry=='NFP Org') {
            Map<String, Object> businessInsurance = new Map<String, Object>();
            businessInsurance.put('accountNumber', '6-9100');
            businessInsurance.put('name', 'Business Insurance');
            List<Map<String, Object>> businessInsuranceExpensesItem = new List<Map<String, Object>>();
            businessInsuranceExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-9110', 'name' => 'Public Liability Insurance'});
            businessInsuranceExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-9120', 'name' => 'Vehicle Insurance'});
            businessInsuranceExpensesItem.add(new Map<String, Object>{'accountNumber' => '6-9130', 'name' => 'Product Liability Insurance'});
            businessInsurance.put('items', businessInsuranceExpensesItem);
            insuranceExpensesLedgers.add(businessInsurance);
        }
        if(selectedIndustry=='NDIS' || selectedIndustry=='Companies'){
              // Ledger 4: Non Profit Trust
            Map<String, Object> nonProfitTrust5 = new Map<String, Object>();
            nonProfitTrust5.put('accountNumber', '6-9200');
            nonProfitTrust5.put('name', 'Non Profit Trust');
            List<Map<String, Object>> nonProfitTrustItems5 = new List<Map<String, Object>>();
            nonProfitTrustItems5.add(new Map<String, Object>{'accountNumber' => '6-9210', 'name' => 'Insurance'});
            nonProfitTrust5.put('items', nonProfitTrustItems5);
            insuranceExpensesLedgers.add(nonProfitTrust5);
            
        }
        insuranceExpenses.put('ledgers', insuranceExpensesLedgers);
        expensesSubCategories.add(insuranceExpenses);
        
        expensesCategory.put('subCategories', expensesSubCategories);
        finalList.add(expensesCategory);
        
        Map<String, Object> otherIncome1 = new Map<String, Object>();
        otherIncome1.put('accountNumber', '7-0000');
        otherIncome1.put('name', 'Other');
        List<Map<String, Object>> otherIncomeSubCategories1 = new List<Map<String, Object>>();
		if(selectedIndustry!='Companies') {
		//if(selectedIndustry=='Imp & Exp Org' || selectedIndustry=='NDIS' || selectedIndustry=='Service' || selectedIndustry=='Retail Org' || selectedIndustry=='Manufacturing'|| selectedIndustry=='NFP Org') {
            // Original data
            String[] otherIncome1LedgerData = new String[]{
                '7-1000:Interest Income',
                '7-2000:Other Income',
                '7-3000:Interest Expense',
                '7-4000:Other Expense',
                '7-5000:Income Tax Expense'
            };
            
            // Loop through each subcategory
            for (String data : otherIncome1LedgerData) {
                List<String> parts = data.split(':');
            
                // Subcategory map
                Map<String, Object> subCategory = new Map<String, Object>();
                subCategory.put('accountNumber', parts[0]);
                subCategory.put('name', parts[1]);
            
                // Ledgers under this subcategory
                List<Map<String, Object>> otherIncomeLedgers1 = new List<Map<String, Object>>();
                Map<String, Object> ledger = new Map<String, Object>();
                ledger.put('accountNumber', parts[0].replace('000', '100'));
                ledger.put('name', 'Ledger Name');
            
                // Items under this ledger
                List<Map<String, Object>> items = new List<Map<String, Object>>();
                items.add(new Map<String, Object>{
                    'accountNumber' => parts[0].replace('000', '110'),
                    'name' => 'Ledger Item'
                });
            
                ledger.put('items', items);
                otherIncomeLedgers1.add(ledger);
            
                subCategory.put('ledgers', otherIncomeLedgers1);
                otherIncomeSubCategories1.add(subCategory);
            }
        }
        if(selectedIndustry=='NDIS' || selectedIndustry=='Companies'){
            Map<String, Object> unrealisedCurrencyGains = new Map<String, Object>();
            unrealisedCurrencyGains.put('accountNumber', '7-6000');
            unrealisedCurrencyGains.put('name', 'Unrealised Currency Gains');
            
            // Ledger under new subcategory
            List<Map<String, Object>> newLedgers = new List<Map<String, Object>>();
            Map<String, Object> newLedger = new Map<String, Object>();
            newLedger.put('accountNumber', '7-6100');
            newLedger.put('name', 'Non Profit Trust');
            
            // Item under new ledger
            List<Map<String, Object>> newItems = new List<Map<String, Object>>();
            newItems.add(new Map<String, Object>{'accountNumber' => '7-6110','name' => 'Unrealised Currency Gains'});
            newLedger.put('items', newItems);
            newLedgers.add(newLedger);
            unrealisedCurrencyGains.put('ledgers', newLedgers);
            
            // Add to the existing subcategory list
            otherIncomeSubCategories1.add(unrealisedCurrencyGains);
        }   
        // Final assignment using your original variable name
        otherIncome1.put('subCategories', otherIncomeSubCategories1);
        finalList.add(otherIncome1);
       /* if(selectedIndustry!='Companies') {   
         //if(selectedIndustry=='Imp & Exp Org' || selectedIndustry=='NDIS' || selectedIndustry=='Service' || selectedIndustry=='Retail Org' || selectedIndustry=='Manufacturing'|| selectedIndustry=='NFP Org') {     
            Map<String, Object> otherExpenses = new Map<String, Object>();
            otherExpenses.put('accountNumber', '9-0000');
            otherExpenses.put('name', 'Other Expenses');
            List<Map<String, Object>> otherExpensesSubCategories = new List<Map<String, Object>>();
            
            String[] otherExpensesLedgerData = new String[]{
                '9-1000:Interest Expense',
                '9-2000:Other Expense',
                '9-3000:Income Tax Expense'
            };
                        
            for (String data : otherExpensesLedgerData) {
                List<String> parts = data.split(':');
                            
                Map<String, Object> subCategory1 = new Map<String, Object>();
                subCategory1.put('accountNumber', parts[0]);
                subCategory1.put('name', parts[1]);
            
                // Ledger under this subcategory
                List<Map<String, Object>> otherExpensesLedgers = new List<Map<String, Object>>();
                Map<String, Object> ledgerNew1 = new Map<String, Object>();
                ledgerNew1.put('accountNumber', parts[0].replace('000', '100'));
                ledgerNew1.put('name', 'Ledger Name');
            
                // Item under this ledger
                List<Map<String, Object>> itemsNew1 = new List<Map<String, Object>>();
                itemsNew1.add(new Map<String, Object>{'accountNumber' => parts[0].replace('000', '110'),'name' => 'Ledger Item'});
            
                ledgerNew1.put('items', itemsNew1);
                otherExpensesLedgers.add(ledgerNew1);
            
                subCategory1.put('ledgers', otherExpensesLedgers);
                otherExpensesSubCategories.add(subCategory1);
           }
                            
        	otherExpenses.put('subCategories', otherExpensesSubCategories);
        	finalList.add(otherExpenses);   
        } */
        return finalList;
      }
    }
   /* @AuraEnabled(cacheable=true)
    public static List<Company__c> getCompanyForEntity(String selectedId) {
        // Initialize a list to hold the result
        List<Company__c> companyData = new List<Company__c>();
    
        if (selectedId != null) {
            // If selectedId is provided, fetch the company with that specific ID
            companyData = [SELECT Id, Company_Name__c, ABN__c, Phone_Number__c, Email__c, Fax_Number__c, Tax__c, Address__c
                           FROM Company__c 
                           WHERE Id = :selectedId];
            System.debug('companyData for selectedId: ' + JSON.serialize(companyData));
        }
        
        return companyData;
    }*/ 
     @AuraEnabled
    public static Boolean checkItemTransactions(Id itemId) {
        if (String.isBlank(itemId)) return false;

        return [
            SELECT COUNT()
            FROM Accounting_Journal_Entry__c
            WHERE Accounting_Ledger_Items__c = :itemId
            LIMIT 1
        ] > 0;
    }
    
}