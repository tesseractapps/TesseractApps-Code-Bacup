public class AccountListTriggerHandler {
    public static void insertRelatedRecords(List<Account_List__c> newCompanies) {
        List<Accounting_Category__c> categoryList = new List<Accounting_Category__c>();
        List<Accounting_Sub_Category__c> subCategoryList = new List<Accounting_Sub_Category__c>();
        List<Accounting_Ledger_Name__c> ledgerNameList = new List<Accounting_Ledger_Name__c>();
        List<Accounting_Ledger_Items__c> ledgerItemList = new List<Accounting_Ledger_Items__c>();
        
        Map<String, Id> categoryIdMap = new Map<String, Id>(); // Store inserted category IDs
        Map<String, Id> subCategoryIdMap = new Map<String, Id>(); // Store Subcategory IDs
        Map<String, Id> ledgerNameIdMap = new Map<String, Id>(); // Store Ledger IDs

        for (Account_List__c company : newCompanies) {
            system.debug(company.Id);
            if (company.Industry__c != null) {
                
                List<List<String>> categoryData = new List<List<String>>();

                // ✅ Step 1: Insert Main Categories
                   if (company.Industry__c.equals('Imp & Exp Org') || company.Industry__c.equals('Service') || company.Industry__c.equals('Manufacturing') || company.Industry__c.equals('Retail Org') || company.Industry__c.equals('NFP Org') || company.Industry__c.equals('NDIS')) {
                    categoryData = new List<List<String>>{
                        new List<String>{'1-0000', 'Assets', company.Industry__c},
                        new List<String>{'2-0000', 'Liabilities', company.Industry__c},
                        new List<String>{'3-0000', 'Equity', company.Industry__c},
                        new List<String>{'4-0000', 'Income', company.Industry__c},
                        new List<String>{'5-0000', 'Cost Of Sales', company.Industry__c},
                        new List<String>{'6-0000', 'Expenses', company.Industry__c},
                        new List<String>{'8-0000', 'Other Income', company.Industry__c},
                        new List<String>{'9-0000', 'Other Expenses', company.Industry__c}
                	};
                  } else if(company.Industry__c.equals('Companies')){
                        categoryData = new List<List<String>>{
                            new List<String>{'1-0000', 'Assets', company.Industry__c},
                            new List<String>{'2-0000', 'Liabilities', company.Industry__c},
                            new List<String>{'3-0000', 'Equity', company.Industry__c},
                            new List<String>{'4-0000', 'Income', company.Industry__c},
                           // new List<String>{'5-0000', 'Cost Of Sales', company.Industry__c},
                            new List<String>{'6-0000', 'Expenses', company.Industry__c},
                            new List<String>{'8-0000', 'Other Income', company.Industry__c}
                            //new List<String>{'9-0000', 'Other Expenses', company.Industry__c}
                        };
                   } 
                  

                for (List<String> data : categoryData) {
                    categoryList.add(new Accounting_Category__c(
                        Name = data[1],
                        Account_Number__c = data[0],
                        Account_List__c = company.Id,
                        Industry__c = data[2]
                        
                    ));
                }
            }
        }

        // ✅ Step 2: Insert Main Categories and Store Their IDs
        if (!categoryList.isEmpty()) {
            Database.insert(categoryList, false);
            system.debug(categoryList.Size());
            for (Accounting_Category__c category : categoryList) {
                categoryIdMap.put(category.Account_Number__c, category.Id);
            }
        }

        // ✅ Step 3: Insert Subcategories Linked to Their Parent Categories
        for (Account_List__c company : newCompanies) {
            if (company.Industry__c != null) {
                system.debug(company.Id);
                List<List<String>> subCategoryData = new List<List<String>>();


                // 🔹 Define Subcategories and their parent category (data[2] = parent Account_Number__c)
                    if (company.Industry__c.equals('Imp & Exp Org') || company.Industry__c.equals('Service') || company.Industry__c.equals('Manufacturing') || company.Industry__c.equals('Retail Org') || company.Industry__c.equals('NFP Org')  || company.Industry__c.equals('NDIS')) {
                        system.debug(company.Id);
                        subCategoryData = new List<List<String>>{
                            new List<String>{'1-1000', 'Current Assets', '1-0000'},
                            new List<String>{'1-2000', 'Non-Current Assets', '1-0000'},
        
                            new List<String>{'2-1000', 'Current Liabilities', '2-0000'},
                            new List<String>{'2-2000', 'Non-Current Liabilities', '2-0000'},
        
                            new List<String>{'3-1000', ' Owner\'s Shareholder\'s Capital', '3-0000'},
                            new List<String>{'3-2000', 'Owner\'s Shareholder\'s Drawings', '3-0000'},
                            new List<String>{'3-3000', 'Retained Earnings', '3-0000'},
                            new List<String>{'3-4000', 'Current Year Earnings', '3-0000'},
                            new List<String>{'3-5000', 'Historical Balancing', '3-0000'},
        
                            new List<String>{'4-1000', 'Sales Income', '4-0000'},
                            
        
                            new List<String>{'5-1000', 'Cost Of Sales', '5-0000'},
                            new List<String>{'5-2000', 'Consumables', '5-0000'},
                            new List<String>{'5-3000', 'Plant/Equipment Hire', '5-0000'},
                            new List<String>{'5-4000', 'Direct Labour', '5-0000'},
                            new List<String>{'5-5000', 'Freight In', '5-0000'},
                            new List<String>{'5-6000', 'Discounts Received', '5-0000'},
                            new List<String>{'5-7000', 'Late Fees Paid', '5-0000'},
                            new List<String>{'5-8000', 'Purchase Returns', '5-0000'},
                            new List<String>{'5-9000', 'Packaging', '5-0000'},
        
                            new List<String>{'6-1000', 'General Expenses', '6-0000'},
                            new List<String>{'6-4000', 'Payroll Expenses', '6-0000'}, 
                            new List<String>{'6-6000', 'Depreciation Expenses', '6-0000'},
                            new List<String>{'6-8000', 'Motor Vehicle Expenses', '6-0000'},
                            new List<String>{'6-9000', 'Insurance Expenses', '6-0000'},
                                 
        
                            new List<String>{'8-1000', 'Interest Income', '8-0000'},
                            new List<String>{'8-2000', 'Other Income', '8-0000'},
        
                            new List<String>{'9-1000', 'Interest Expense', '9-0000'},
                            new List<String>{'9-2000', 'Other Expense', '9-0000'},
                            new List<String>{'9-3000', 'Income Tax Expense', '9-0000'}  
                      };
                      if (company.Industry__c.equals('NDIS')) {
                          subCategoryData.add(new List<String>{'1-4000', 'Fixed Assets', '1-0000'});
                          subCategoryData.add(new List<String>{'4-2000', 'Realised Currency Gains', '4-0000'});
                          subCategoryData.add(new List<String>{'6-3000', 'Cost of Goods Sold', '6-0000'});
                          subCategoryData.add(new List<String>{'7-3000', 'Unrealised Currency Gains', '7-0000'});
                      }
                   } else  if (company.Industry__c.equals('Companies')){
                        subCategoryData = new List<List<String>>{
                            new List<String>{'1-1000', 'Current Assets', '1-0000'},
                            new List<String>{'1-2000', 'Non-Current Assets', '1-0000'},
        					new List<String>{'1-4000', 'Fixed Assets', '1-0000'},
                            new List<String>{'2-1000', 'Current Liabilities', '2-0000'},
                            new List<String>{'2-2000', 'Non-Current Liabilities', '2-0000'},
        
                            new List<String>{'3-1000', ' Owner\'s Shareholder\'s Capital', '3-0000'},
                            new List<String>{'3-2000', 'Owner\'s Shareholder\'s Drawings', '3-0000'},
                            new List<String>{'3-3000', 'Retained Earnings', '3-0000'},
                            new List<String>{'3-4000', 'Current Year Earnings', '3-0000'},
                            new List<String>{'3-5000', 'Historical Balancing', '3-0000'},
        
                            new List<String>{'4-1000', 'Sales Income', '4-0000'},
                            new List<String>{'4-2000', 'Realised Currency Gains', '4-0000'},
        
                            new List<String>{'6-1000', 'General Expenses', '6-0000'},
                            new List<String>{'6-3000', 'Cost of Goods Sold', '6-0000'},
                            new List<String>{'6-4000', 'Payroll Expenses', '6-0000'}, 
                            new List<String>{'6-6000', 'Depreciation Expenses', '6-0000'},
                            new List<String>{'6-8000', 'Motor Vehicle Expenses', '6-0000'},
                            new List<String>{'6-9000', 'Insurance Expenses', '6-0000'},
                             
                            new List<String>{'8-3000', 'Unrealised Currency Gains', '8-0000'}
                           
                        };
                   } 
              

                for (List<String> data : subCategoryData) {
                    Id parentCategoryId = categoryIdMap.get(data[2]); // Get parent category ID

                    if (parentCategoryId != null) {
                        Accounting_Sub_Category__c subCategory = new Accounting_Sub_Category__c(
                            Name = data[1],
                            Account_Number__c = data[0],
                            Category__c = parentCategoryId
                        );
                        system.debug('data[0]===>'+data[0]);
                        subCategoryList.add(subCategory);
                    }
                }
            }
        }

        // ✅ Step 4: Insert Subcategories
        if (!subCategoryList.isEmpty()) {
            Database.insert(subCategoryList, false);
            system.debug(subCategoryList.Size());
            for (Accounting_Sub_Category__c subCategory : subCategoryList) {
                subCategoryIdMap.put(subCategory.Account_Number__c, subCategory.Id);
            }
        }
        
        // ✅ Step 5: Insert Ledger Names Linked to Categories and Subcategories
        for (Account_List__c company : newCompanies) {
            if (company.Industry__c != null) {
                List<List<String>> ledgerNameData = new List<List<String>>();
                List<List<String>> newLedgerNameData = new List<List<String>>();
                //List<List<String>> initialLedgerNameData = new List<List<String>>();
                if (company.Industry__c.equals('Imp & Exp Org') || company.Industry__c.equals('Service') || company.Industry__c.equals('Manufacturing') || company.Industry__c.equals('Retail Org') || company.Industry__c.equals('NFP Org') || company.Industry__c.equals('NDIS')) {
                    ledgerNameData = new List<List<String>>{
                    new List<String>{'1-1100', 'Bank Accounts', '1-1000', '1-0000'},
                    new List<String>{'1-1200', 'Clearing Accounts', '1-1000', '1-0000'},
                    new List<String>{'1-1300', 'Other Current Assets', '1-1000', '1-0000'},
                    new List<String>{'1-1400', 'GST Assets', '1-1000', '1-0000'},
                     
                    new List<String>{'1-2100', 'Plant & Equipment', '1-2000', '1-0000'},
                    new List<String>{'1-2200', 'Furniture', '1-2000', '1-0000'},
                    new List<String>{'1-2300', 'Office Equipment', '1-2000', '1-0000'},
                    new List<String>{'1-2400', 'Computers', '1-2000', '1-0000'},
                    new List<String>{'1-2500', 'Motor Vehicles', '1-2000', '1-0000'},
                    new List<String>{'1-2600', 'Low Value Pool', '1-2000', '1-0000'},
                    new List<String>{'1-2700', 'Buildings', '1-2000', '1-0000'},
                    new List<String>{'1-2800', 'Warehouse Equipment', '1-2000', '1-0000'},
                    new List<String>{'1-2900', 'Improvements', '1-2000', '1-0000'},
                    new List<String>{'1-3000', 'Leased Equipment', '1-2000', '1-0000'},
                    new List<String>{'1-3100', 'Land', '1-2000', '1-0000'},
                       
                    new List<String>{'2-1100', 'Credit Cards', '2-1000', '2-0000'},
                    new List<String>{'2-1200', 'GST Liabilities', '2-1000', '2-0000'},
                    new List<String>{'2-1300', 'Other Tax/Withholding Liab', '2-1000', '2-0000'},
                    new List<String>{'2-1400', 'Payroll Liabilities', '2-1000', '2-0000'},
                    new List<String>{'2-1500', 'Other Current Liabilities', '2-1000', '2-0000'},
                       
                    new List<String>{'2-2100', 'Business Loan #1', '2-2000', '2-0001'},
                    new List<String>{'2-2200', 'Business Loan #2', '2-2000', '2-0001'},
                    new List<String>{'2-2300', 'Business Loan #3', '2-2000', '2-0001'},
                    new List<String>{'2-2400', 'Business Loan #4', '2-2000', '2-0001'},
                        
                   new List<String>{'3-1100', 'Ledger', '3-1000', '3-0000'},
                        
                   new List<String>{'3-2100', 'Ledger', '3-2000', '3-0000'},
                     
                   new List<String>{'3-3100', 'Ledger', '3-3000', '3-0000'},
                      
                   new List<String>{'3-4100', 'Ledger', '3-4000', '3-0000'},
                      
                   new List<String>{'3-5100', 'Ledger', '3-5000', '3-0000'},
                     
                   new List<String>{'4-1100', 'Sales Income #1', '4-1000', '4-0000'},
                   
                   new List<String>{'5-1100', 'Ledger', '5-1000', '5-0000'},
                       
                   new List<String>{'5-2100', 'Ledger', '5-2000', '5-0000'},
                    
                   new List<String>{'5-3100', 'Ledger', '5-3000', '5-0000'},
                       
                   new List<String>{'5-4100', 'Ledger', '5-4000', '5-0000'},
                     
                   new List<String>{'5-5100', 'Ledger', '5-5000', '5-0000'},
                       
                   new List<String>{'5-6100', 'Ledger', '5-6000', '5-0000'},
                       
                   new List<String>{'5-7100', 'Ledger', '5-7000', '5-0000'},
                     
                   new List<String>{'5-8100', 'Ledger', '5-8000', '5-0000'},
                       
                   new List<String>{'5-9100', 'Ledger', '5-9000', '5-0000'},
                      
                   new List<String>{'6-1100', 'General Expenses', '6-1000', '6-0000'},
                    
                   new List<String>{'6-4100', 'Wages & Salaries Expenses', '6-4000', '6-0000'},
                     
                   new List<String>{'6-6100', 'Plant Depreciation', '6-6000', '6-0000'},
                     
                   new List<String>{'6-8100', 'Motor Vehicle Registration', '6-8000', '6-0000'},
                    
                   new List<String>{'6-9100', 'Business Insurance', '6-9000', '6-0000'},
                 
                   new List<String>{'8-1100', 'Ledger', '8-1000', '8-0000'},
                       
                   new List<String>{'8-2100', 'Ledger', '8-2000', '8-0000'},
                      
                   new List<String>{'9-1100', 'Ledger', '9-1000', '9-0000'},
                       
                   new List<String>{'9-2100', 'Ledger', '9-2000', '9-0000'},
                       
                   new List<String>{'9-3100', 'Ledger', '9-3000', '9-0000'}    
                        
                };
              
             } 
                if (company.Industry__c.equals('NDIS') || company.Industry__c.equals('Companies')) {
                   List<string> codesToRemove = new List<string> { '3-1100', '3-2100', '3-3100', '3-4100', '3-5100' };

					//ledgerNameData.RemoveAll(entry => codesToRemove.Contains(entry[0]));
                   for (Integer i = ledgerNameData.size() - 1; i >= 0; i--) {
                        if (codesToRemove.contains(ledgerNameData[i][0])) {
                            ledgerNameData.remove(i);
                        }
                    }
                
                    // Output the result (for testing purposes)
                    for (List<String> entry : ledgerNameData) {
                        System.debug(entry);
                    }
                    
                   newLedgerNameData = new List<List<String>>{
                       new List<String>{'1-1500', 'Non Profit Trust', '1-1000', '1-0000'},
                       new List<String>{'1-1600', 'Profitable Trust', '1-1000', '1-0000'},
                       
                       new List<String>{'1-3200', 'Non Profit Trust', '1-2000', '1-0000'},
                       new List<String>{'1-3300', 'Profitable Trust', '1-2000', '1-0000'},
                       new List<String>{'1-4100', 'Non Profit Trust', '1-4000', '1-0000'},
                       new List<String>{'1-4200', 'Profitable Trust', '1-4000', '1-0000'},
                        
                       new List<String>{'2-1600', 'Non Profit Trust', '2-1000', '2-0000'},
                       new List<String>{'2-1800', 'Profitable Trust', '2-1000', '2-0000'},
                       new List<String>{'2-2500', 'Non Profit Trust', '2-2000', '2-0000'},
                       new List<String>{'2-2600', 'Profitable Trust', '2-2000', '2-0000'},
                        
                       new List<String>{'3-1100', 'Non Profit Trust', '3-1000', '3-0000'},
                       new List<String>{'3-2100', 'Non Profit Trust', '3-2000', '3-0000'},
                       new List<String>{'3-3100', 'Profitable Trust', '3-3000', '3-0000'},
                       new List<String>{'3-4100', 'Profitable Trust', '3-4000', '3-0000'},
                       new List<String>{'3-5100', 'Profitable Trust', '3-5000', '3-0000'},
                        
                       new List<String>{'4-1200', 'Non Profit Trust', '4-1000', '4-0000'},
                       new List<String>{'4-1400', 'Profitable Trust', '4-1000', '4-0000'},
                       new List<String>{'4-2100', 'Non Profit Trust', '4-2000', '4-0000'},
                        
                       new List<String>{'6-1400', 'Non Profit Trust', '6-1000', '6-0000'},
                       new List<String>{'6-1600', 'Profitable Trust', '6-1000', '6-0000'},
                       new List<String>{'6-3100', 'Non Profit Trust', '6-3000', '6-0000'},
                       new List<String>{'6-3200', 'Profitable Trust', '6-3000', '6-0000'},
                       new List<String>{'6-4200', 'Non Profit Trust', '6-4000', '6-0000'},
                       new List<String>{'6-4300', 'Profitable Trust', '6-4000', '6-0000'},
                       new List<String>{'6-6300', 'Non Profit Trust', '6-6000', '6-0000'},
                       new List<String>{'6-8200', 'Non Profit Trust', '6-8000', '6-0000'},
                       new List<String>{'6-8300', 'Profitable Trust', '6-8000', '6-0000'},
                       new List<String>{'6-9200', 'Non Profit Trust', '6-9000', '6-0000'},
                        
                       new List<String>{'8-3100', 'Non Profit Trust', '8-3000', '8-0000'}
                   
                   };
                  ledgerNameData.addAll(newLedgerNameData);
                } /*else if(company.Industry__c.equals('Companies')) {
                   ledgerNameData = newLedgerNameData;
              }*/
                
                for (List<String> data : ledgerNameData) {
                    Id parentSubCategoryId = subCategoryIdMap.get(data[2]); // Get Subcategory ID
                    
                    
                    Id parentCategoryId = categoryIdMap.get(data[3]); // Get Category ID

                    if (parentSubCategoryId != null && parentCategoryId != null) {
                        Accounting_Ledger_Name__c ledgerName = new Accounting_Ledger_Name__c(
                            Name = data[1],
                            Account_Number__c = data[0],
                            Sub_Category__c = parentSubCategoryId, // ✅ Linking to Subcategory
                            Category__c = parentCategoryId // ✅ Linking to Category
                        );
                        system.debug('data[0])====>'+data[0]);
                        ledgerNameList.add(ledgerName);
                    }
                }
            }
        }

        // ✅ Step 6: Insert Ledger Names
        if (!ledgerNameList.isEmpty()) {
            Database.insert(ledgerNameList, false);
            system.debug(ledgerNameList.Size());
            for (Accounting_Ledger_Name__c ledgerName : ledgerNameList) {
                ledgerNameIdMap.put(ledgerName.Account_Number__c, ledgerName.Id);
            }
        }
        
        for (Account_List__c company : newCompanies) {
            if (company.Industry__c != null) {
                List<List<String>> ledgerItemData = new List<List<String>>();
                List<List<String>> NewLedgerItemData = new List<List<String>>();
                system.debug('company.Industry__c above if ===>'+company.Industry__c);

                if (company.Industry__c.equals('Imp & Exp Org') || company.Industry__c.equals('Service') || 
                    company.Industry__c.equals('Manufacturing') || company.Industry__c.equals('Retail Org') || 
                    company.Industry__c.equals('NFP Org') || company.Industry__c.equals('NDIS')) {
                    system.debug('company.Industry__c in if ===>'+company.Industry__c);
                    ledgerItemData = new List<List<String>>{
                        //Bank Accounts
                        new List<String>{'1-1110', 'Business Bank Account #1', '1-1100', '1-1000', '1-0000'},
                        new List<String>{'1-1120', 'Business Bank Account #2', '1-1100', '1-1000', '1-0000'},
                        new List<String>{'1-1130', 'Business Bank Account #3', '1-1100', '1-1000', '1-0000'},
                        new List<String>{'1-1140', 'Petty Cash/Cash On Hand', '1-1100', '1-1000', '1-0000'},
                            
                        //Clearing Accounts
                        new List<String>{'1-1210', 'Undeposited Funds Account', '1-1200', '1-1000', '1-0000'},
                        new List<String>{'1-1220', 'Electronic Clearing Account', '1-1200', '1-1000', '1-0000'},
                        new List<String>{'1-1230', 'Payroll Clearing Account', '1-1200', '1-1000', '1-0000'},
                            
                        // Other Current Assets    
                        new List<String>{'1-1310', 'Trade Debtors', '1-1300', '1-1000', '1-0000'},
                        new List<String>{'1-1320', 'Inventory', '1-1300', '1-1000', '1-0000'},
                        new List<String>{'1-1330', 'Deposits To Suppliers', '1-1300', '1-1000', '1-0000'},
                        new List<String>{'1-1340', 'Voluntary Withholding Credits', '1-1300', '1-1000', '1-0000'},
                        new List<String>{'1-1350', 'ABN Withholding Credits', '1-1300', '1-1000', '1-0000'},
                        
                        //GST Assests
                        new List<String>{'1-1410', 'GST Paid', '1-1400', '1-1000', '1-0000'},
                         
                        // Plant & Equipment
                        new List<String>{'1-2110', 'Plant & Equipment At Cost', '1-2100', '1-2000', '1-0000'},
                        new List<String>{'1-2120', 'Accum. Depr. Plant & Equipment', '1-2100', '1-2000', '1-0000'},
                            
                            
                        //Furniture   
                        new List<String>{'1-2210', 'Furniture At Cost', '1-2200', '1-2000', '1-0000'},
                        new List<String>{'1-2220', 'Accum. Depr. Furniture', '1-2200', '1-2000', '1-0000'},
                        
                        //Office Equipment    
                        new List<String>{'1-2310', 'Office Equipment At Cost', '1-2300', '1-2000', '1-0000'},
                        new List<String>{'1-2320', 'Accum. Depr. Office Equipment', '1-2300', '1-2000', '1-0000'},
                        
                        //Computers    
                        new List<String>{'1-2410', 'Computers At Cost', ' 1-2400', '1-2000', '1-0000'},
                        new List<String>{'1-2420', 'Accum. Depr. Computers', ' 1-2400', '1-2000', '1-0000'},
                         
                        // Motor Vehicles    
                        new List<String>{'1-2510', 'Motor Vehicles #1 At Cost', '1-2500', '1-2000', '1-0000'},
                        new List<String>{'1-2520', 'Accum. Depr. Motor Vehicles #1', '1-2500', '1-2000', '1-0000'},
                        new List<String>{'1-2530', 'Motor Vehicles #2 At Cost', '1-2500', '1-2000', '1-0000'},
                        new List<String>{'1-2540', 'Accum. Depr. Motor Vehicles #2', '1-2500', '1-2000', '1-0000'},
                        new List<String>{'1-2550', 'Motor Vehicles #3 At Cost', '1-2500', '1-2000', '1-0000'},
                        new List<String>{'1-2560', 'Accum. Depr. Motor Vehicles #3', '1-2500', '1-2000', '1-0000'},
                            
                        //Low Value Pool   
                        new List<String>{'1-2610', 'Low Value Pool At Cost', '1-2600', '1-2000', '1-0000'},
                        new List<String>{'1-2620', 'Accum. Depr. Low Value Pool', '1-2600', '1-2000', '1-0000'},
                        
                        //Buildings    
                        new List<String>{'1-2710', 'Buildings At Cost', '1-2700', '1-2000', '1-0000'},
                        new List<String>{'1-2720', 'Accum. Depr. Buildings', '1-2700', '1-2000', '1-0000'},
                        //Warehouse Equipment    
                        new List<String>{'1-2810', 'Warehouse Equipment At Cost', '1-2800', '1-2000', '1-0000'},
                        new List<String>{'1-2820', 'Accum. Depr. Warehouse Equip', '1-2800', '1-2000', '1-0000'},
                        
                        //Improvements    
                        new List<String>{'1-2910', 'Improvements At Cost', '1-2900', '1-2000', '1-0000'},
                        new List<String>{'1-2920', 'Accum. Depr. Improvements', '1-2900', '1-2000', '1-0000'},
                        
                        //Leased Equipment    
                        new List<String>{'1-3010', 'Leased Equipment At Cost', '1-3000', '1-2000', '1-0000'},
                        new List<String>{'1-3020', 'Accum. Depr. Leased Equipment', '1-3000', '1-2000', '1-0000'},
                        
                        //Land    
                        new List<String>{'1-3110', 'Land At Cost', '1-3100', '1-2000', '1-0000'},
                            
                        //Credit Cards    
                        new List<String>{'2-1110', 'Visa #1', '2-1100', '2-1000', '2-0000'},
                        new List<String>{'2-1120', 'Mastercard #1', '2-1000', '2-2001', '2-0000'},
                        new List<String>{'2-1130', 'AMEX #1', '2-1100', '2-1000', '2-0000'},
                        new List<String>{'2-1140', 'Visa #2', '2-1100', '2-1000', '2-0000'},
                        new List<String>{'2-1150', 'Mastercard #2', '2-1100', '2-1000', '2-0000'},
                        new List<String>{'2-1160', 'AMEX #2', '2-1100', '2-1000', '2-0000'},
                        new List<String>{'2-1170', 'Land At Cost', '2-1100', '2-1000', '2-0000'},
                            
                        //GST Liabilities
                        new List<String>{'2-1210', 'GST Collected', '2-1200', '2-1000', '2-0000'},
                        //new List<String>{'2-1220', 'GST Paid', '2-1200', '2-1000', '2-0000'},
                            
                        //Other Tax/Withholding Liab.
                        new List<String>{'2-1310', 'Voluntary Withholdings Payable', '2-1300', '2-1000', '2-0000'},
                        new List<String>{'2-1320', 'ABN Withholdings Payable', '2-1300', '2-1000', '2-0000'},
                        new List<String>{'2-1330', 'Company Tax Instal. Payable', '2-1300', '2-1000', '2-0000'},
                        new List<String>{'2-1340', 'FBT Instalments Payable', '2-1300', '2-1000', '2-0000'},
                        new List<String>{'2-1350', 'Fuel Tax Credits Payable', '2-1300', '2-1000', '2-0000'},
                        new List<String>{'2-1360', 'Luxury Car Tax Payable', '2-1300', '2-1000', '2-0000'},
                        new List<String>{'2-1370', 'Sales Tax Payable', '2-1300', '2-1000', '2-0000'},
                           
                        //Payroll Liabilities
                        new List<String>{'2-1410', 'PAYG Withholding Payable', '2-1400', '2-1000', '2-0000'},
                        new List<String>{'2-1420', 'Superannuation Fund #1', '2-1400', '2-1000', '2-0000'},
                        new List<String>{'2-1430', 'Superannuation Fund #2', '2-1400', '2-1000', '2-0000'},
                        new List<String>{'2-1440', 'Superannuation Fund #3', '2-1400', '2-1000', '2-0000'},
                        new List<String>{'2-1450', 'Superannuation Fund #4', '2-1400', '2-1000', '2-0000'},
                        new List<String>{'2-1460', 'Superannuation Fund #5', '2-1400', '2-1000', '2-0000'},
                        new List<String>{'2-1470', 'Child Care Payable', '2-1400', '2-1000', '2-0000'},
                        new List<String>{'2-1480', 'Union Fees Payable', '2-1400', '2-1000', '2-0000'},
                        new List<String>{'2-1490', 'Other Payroll Liabilities', '2-1400', '2-1000', '2-0000'},
                         
                        // Other Current Liabilities
                        new List<String>{'2-1510', 'Trade Creditors', '2-1500', '2-1000', '2-0000'},
                        new List<String>{'2-1520', 'Customer Deposits', '2-1500', '2-1000', '2-0000'},
                        new List<String>{'2-1530', 'A/P Accrual -Inventory', '2-1500', '2-1000', '2-0000'},
                        new List<String>{'2-1540', 'Lease On Equipment', '2-1500', '2-1000', '2-0000'},
                        new List<String>{'2-1550', 'Liability #1', '2-1500', '2-1000', '2-0000'},
                        new List<String>{'2-1560', 'Liability #2', '2-1500', '2-1000', '2-0000'},
                           
                        // Business Loan #1
                        new List<String>{'2-2110', 'Ledger Item', '2-2100', '2-2000', '2-0000'},
                            
                        //Business Loan #2
                        new List<String>{'2-2210', 'Ledger Item', '2-2200', '2-2000', '2-0000'},
                            
                        // Business Loan #3
                        new List<String>{'2-2310', 'Ledger Item', '2-2300', '2-2000', '2-0000'},
                         
                        //Business Loan #4
                        new List<String>{'2-2410', 'Ledger Item', '2-2400', '2-2000', '2-0000'},
                            
                       // Owner's/Shareholder's Capital
                       new List<String>{'3-1110', 'Ledger Item', '3-1100', '3-1000', '3-0000'},
                       // Owner's/Shareholder's Drawings    
                       new List<String>{'3-2110', 'Ledger Item', '3-2100', '3-2000', '3-0000'},
                       //Retained Earnings    
                       new List<String>{'3-3110', 'Ledger Item', '3-3100', '3-3000', '3-0000'},
                       //Current Year Earnings    
                       new List<String>{'3-4110', 'Ledger Item', '3-4100', '3-4000', '3-0000'},
                       // Historical Balancing    
                       new List<String>{'3-5110', 'Ledger Item', '3-5100', '3-5000', '3-0000'},
                           
                       //Sales Income #1    
                       new List<String>{'4-1110', 'Sales Income #1', '4-1100', '4-1000', '4-0000'},
                       //Sales Income #2  
                       new List<String>{'4-1120', 'Sales Income #2', '4-1100', '4-1000', '4-0000'},
                       //Sales Income #3    
                       new List<String>{'4-1130', 'Sales Income #3', '4-1100', '4-1000', '4-0000'},
                       // Late Fees Collected 
                       new List<String>{'4-1140', 'Late Fees Collected', '4-1100', '4-1000', '4-0000'},
                       // Foreign Sales Income   
                       new List<String>{'4-1150', 'Foreign Sales Income', '4-1100', '4-1000', '4-0000'},
                       //Freight Income    
                       new List<String>{'4-1160', 'Freight Income', '4-1100', '4-1000', '4-0000'},
                       // Fuel Tax Credits   
                       new List<String>{'4-1170', 'Fuel Tax Credits', '4-1100', '4-1000', '4-0000'},
                           
                       //Cost Of Sales    
                       new List<String>{'5-1110', 'Ledger Item', '5-1100', '5-1000', '5-0000'},
                       // Consumables
                       new List<String>{'5-2110', 'Ledger Item', '5-2100', '5-2000', '5-0000'},
                       //  Plant/Equipment Hire  
                       new List<String>{'5-3110', 'Ledger Item', '5-3100', '5-3000', '5-0000'},
                       //Direct Labour
                       new List<String>{'5-4110', 'Ledger Item', '5-4100', '5-4000', '5-0000'},
                       // Freight In
                       new List<String>{'5-5110', 'Ledger Item', '5-5100', '5-5000', '5-0000'},
                       // Discounts Received	   
                       new List<String>{'5-6110', 'Ledger Item', '5-6100', '5-6000', '5-0000'},
                       // Late Fees Paid   
                       new List<String>{'5-7110', 'Ledger Item', '5-7100', '5-7000', '5-0000'},
                       //  Purchase Returns  
                       new List<String>{'5-8110', 'Ledger Item', '5-8100', '5-8000', '5-0000'},
                       //  Packaging  
                       new List<String>{'5-9110', 'Ledger Item', '5-9100', '5-9000', '5-0001'},
                           
                           
                      new List<String>{'6-1110', 'Accounting/Bookeeping Fees', '6-1100', '6-1000', '6-0000'},
                      new List<String>{'6-1120', 'Advertising & Marketing', '6-1100', '6-1000', '6-0000'},
                      new List<String>{'6-1130', 'Bank Fees', '6-1100', '6-1000', '6-0000'},
                      new List<String>{'6-1140', 'Borrowing Expenses', '6-1100', '6-1000', '6-0000'},
                      new List<String>{'6-1150', 'Bad Debts', '6-1100', '6-1000', '6-0000'},
                      new List<String>{'6-1160', 'Cleaning Expenses', '6-1100', '6-1000', '6-0000'},
                      new List<String>{'6-1170', 'Electricity Expenses', '6-1100', '6-1000', '6-0000'},
                      new List<String>{'6-1180', 'Gas Expenses', '6-1100', '6-1000', '6-0000'},
                      new List<String>{'6-1190', 'Legal Fees', '6-1100', '6-1000', '6-0000'},
                      new List<String>{'6-1200', 'Telephone Expenses', '6-1100', '6-1000', '6-0000'},
                      new List<String>{'6-1210', 'Parking/Tolls Expenses', '6-1100', '6-1000', '6-0000'},
                      new List<String>{'6-1220', 'Equip. Repairs & Maintenance', '6-1100', '6-1000', '6-0000'},
                      new List<String>{'6-1230', 'General Repairs & Maintenance', '6-1100', '6-1000', '6-0000'},
                      new List<String>{'6-1240', 'Internet', '6-1100', '6-1000', '6-0000'},
                      new List<String>{'6-1250', 'Computer Expenses', '6-1100', '6-1000', '6-0000'},
                      new List<String>{'6-1260', 'Council Rates', '6-1100', '6-1000', '6-0000'},
                      new List<String>{'6-1270', 'Water Expenses', '6-1100', '6-1000', '6-0000'},
                      new List<String>{'6-1280', 'Stationery', '6-1100', '6-1000', '6-0000'},
                      new List<String>{'6-1290', 'Printing', '6-1100', '6-1000', '6-0000'},
                      new List<String>{'6-1300', 'Waste Removal', '6-1100', '6-1000', '6-0000'},
                      new List<String>{'6-1310', 'Freight Out', '6-1100', '6-1000', '6-0000'},
                      new List<String>{'6-1320', 'Postage', '6-1100', '6-1000', '6-0000'},
                      new List<String>{'6-1330', 'Inv. Adj. Shrinkage/Spoilage', '6-1100', '6-1000', '6-0000'},
                      new List<String>{'6-1340', 'Discounts Given', '6-1100', '6-1000', '6-0000'},
                          
                      new List<String>{'6-4110', 'Work Cover Premiums', '6-4100', '6-4000', '6-0000'},
                      new List<String>{'6-4120', 'Superannuation Expenses', '6-4100', '6-4000', '6-0000'},
                      new List<String>{'6-4130', 'Uniforms', '6-4100', '6-4000', '6-0000'},
                      new List<String>{'6-4140', 'Staff Training Expenses', '6-4100', '6-4000', '6-0000'},
                      new List<String>{'6-4150', 'Director\'s Fees', '6-4100', '6-4000', '6-0000'},
                      new List<String>{'6-4160', 'Travel & Accom. Expenses', '6-4100', '6-4000', '6-0000'},
                      new List<String>{'6-4170', 'Food', '6-4100', '6-4000', '6-0000'},
                      new List<String>{'6-4180', 'Mobile Phone Expenses', '6-4100', '6-4000', '6-0000'},
                      new List<String>{'6-4190', 'Other Payroll Expenses', '6-4100', '6-4000', '6-0000'},
                         
                      new List<String>{'6-6110', 'Furniture Depreciation', '6-6100', '6-6000', '6-0000'},
                      new List<String>{'6-6120', 'Office Equipment Depreciation', '6-6100', '6-6000', '6-0000'},
                      new List<String>{'6-6130', 'Computer Depreciation', '6-6100', '6-6000', '6-0000'},
                      new List<String>{'6-6140', 'Motor Vehicle Depreciation #1', '6-6100', '6-6000', '6-0000'},
                      new List<String>{'6-6150', 'Motor Vehicle Depreciation #2', '6-6100','6-6000', '6-0000'},
                      new List<String>{'6-6160', 'Motor Vehicle Depreciation #3', '6-6100', '6-6000', '6-0000'},
                      new List<String>{'6-6170', 'Low Value Pool Depreciation', '6-6100', '6-6000', '6-0000'},
                      new List<String>{'6-6180', 'Buildings Depreciation', '6-6100', '6-6000', '6-0000'},
                      new List<String>{'6-6190', 'Warehouse Equip. Depreciation', '6-6100', '6-6000', '6-0000'},
                      new List<String>{'6-6200', 'Improvements Depreciation', '6-6100', '6-6000', '6-0000'},
                      new List<String>{'6-6210', 'Leased Equipment Depreciation', '6-6100', '6-6000', '6-0000'},
                          
                          
                      new List<String>{'6-8110', 'Motor Vehicle Insurance', '6-8100', '6-8000', '6-0000'},
                      new List<String>{'6-8120', 'Motor Vehicle Fuel/Oil', '6-8100', '6-8000', '6-0000'},
                      new List<String>{'6-8130', 'Motor Vehicle Maintenance', '6-8100', '6-8000', '6-0000'},
                          
                      new List<String>{'6-9110', 'Public Liability Insurance', '6-9100', '6-9000', '6-0000'},
                      new List<String>{'6-9120', 'Vehicle Insurance', '6-9100', '6-9000', '6-0000'},
                      new List<String>{'6-9130', 'Product Liability Insurance', '6-9100', '6-9000', '6-0000'},
                          
                          
                      new List<String>{'8-1110', 'Ledger Item', '8-1100', '8-1000', '8-0000'},
                      new List<String>{'8-2110', 'Ledger Item', '8-2100', '8-2000', '8-0000'},
                          
                          
                      new List<String>{'9-1110', 'Ledger Item', '9-1100', '9-1000', '9-0000'},
                      new List<String>{'9-2110', 'Ledger Item', '9-2100', '9-2000', '9-0000'},
                      new List<String>{'9-3110', 'Ledger Item', '9-3100', '9-3000', '9-0000'}
                        
                     
                    };
                        
                 } 
                if (company.Industry__c.equals('NDIS') || company.Industry__c.equals('Companies')) {
                   List<string> codesToRemove1 = new List<string> { '3-1110', '3-2110', '3-3110', '3-4110', '3-5110' };

					//ledgerNameData.RemoveAll(entry => codesToRemove.Contains(entry[0]));
                   for (Integer i = ledgerItemData.size() - 1; i >= 0; i--) {
                        if (codesToRemove1.contains(ledgerItemData[i][0])) {
                            ledgerItemData.remove(i);
                        }
                    }
                
                    // Output the result (for testing purposes)
                    for (List<String> entry : ledgerItemData) {
                        System.debug(entry);
                    }
                    
                   NewLedgerItemData = new List<List<String>>{
                     
                       //Non Profit Trust in Current Assets
                        new List<String>{'1-1510', 'Accounts Receivables', '1-1500', '1-1000', '1-0000'},
                        new List<String>{'1-1520', 'Cash on Hand', '1-1500', '1-1000', '1-0000'},
                        new List<String>{'1-1530', 'Cash at Bank - Restricted', '1-1500', '1-1000', '1-0000'},
                        new List<String>{'1-1540', 'Cash at Bank - Unrestricted', '1-1500', '1-1000', '1-0000'},
                        new List<String>{'1-1550', 'Accounts Receivables', '1-1500', '1-1000', '1-0000'},
                        new List<String>{'1-1560', 'Petty Cash', '1-1500', '1-1000', '1-0000'},
                        new List<String>{'1-1570', 'Prepayments', '1-1500', '1-1000', '1-0000'},
                            
                        //Profitable Trust in Current Assets
                        new List<String>{'1-1610', 'Investment Account', '1-1600', '1-1000', '1-0000'},
                        new List<String>{'1-1620', 'Undeposited Funds', '1-1600', '1-1000', '1-0000'},
                        new List<String>{'1-1630', 'Inventory on Hand', '1-1600', '1-1000', '1-0000'},
                        new List<String>{'1-1640', 'Other Current Assets', '1-1600', '1-1000', '1-0000'},  
                        
                        // Non Profit Trust in Non-Current Assets 
                        new List<String>{'1-3210', 'Provision for Doubtful Debts', '1-3200', '1-2000', '1-0000'},
                        new List<String>{'1-3220', 'Long-Term Investments', '1-3200', '1-2000', '1-0000'},
                        new List<String>{'1-3230', 'ABN Withholding Credits', '1-3200', '1-2000', '1-0000'},
                        new List<String>{'1-3240', 'Borrowing Costs', '1-3200', '1-2000', '1-0000'},
                        new List<String>{'1-3250', 'Intangibles', '1-3200', '1-2000', '1-0000'},
                       
                        // Profitable Trust in Non-Current Assets   
                        new List<String>{'1-3310', 'Land', '1-3300', '1-2000', '1-0000'},
                        new List<String>{'1-3320', 'Buildings', '1-3300', '1-2000', '1-0000'},
                        new List<String>{'1-3330', 'Accumulated Depreciation on Buildings', '1-3300', '1-2000', '1-0000'},
                        new List<String>{'1-3340', 'Long-Term Investments', '1-3300', '1-2000', '1-0000'},
                        new List<String>{'1-3350', 'Loan', '1-3300', '1-2000', '1-0000'},
                        new List<String>{'1-3360', 'Other Non-Current Assets', '1-3300', '1-2000', '1-0000'},
                        
                        // Non Profit Trust in Fixed Assets 
                        new List<String>{'1-4110', 'Computer Equipment', '1-4100', '1-4000', '1-0000'},
                        new List<String>{'1-4120', 'Computer Equipment - Acc Depre', '1-4100', '1-4000', '1-0000'},
                        new List<String>{'1-4130', 'Furniture & fixtures', '1-4100', '1-4000', '1-0000'},
                        new List<String>{'1-4140', 'Furniture & fixtures- Accum Depre', '1-4100', '1-4000', '1-0000'},
                            
                        //Profitable Trust in  Fixed Assets  
                        new List<String>{'1-4210', 'Motor Vehicle at cost', '1-4200', '1-4000', '1-0000'},
                        new List<String>{'1-4220', 'Motor Vehicle at cost - Acc Depre', '1-4200', '1-4000', '1-0000'},
                        new List<String>{'1-4230', 'Motor Vehicle at cost - Acc Depre', '1-4200', '1-4000', '1-0000'},
                        new List<String>{'1-4240', 'Office Equipment - Acc Depre', '1-4200', '1-4000', '1-0000'},
                            
                        //Non Profit Trust in Current Liabilities
                        new List<String>{'2-1610', 'Accounts Payable', '2-1600', '2-1000', '2-0000'},
                        new List<String>{'2-1620', 'ATO Integrated Client Account', '2-1600', '2-1000', '2-0000'},
                        new List<String>{'2-1630', 'Bank Overdraft', '2-1600', '2-1000', '2-0000'},
                        new List<String>{'2-1640', 'Chattel Mortgage CL', '2-1600', '2-1000', '2-0000'},
                        new List<String>{'2-1650', 'Hire Purchase Liability CL', '2-1600', '2-1000', '2-0000'},
                        new List<String>{'2-1660', 'GST', '2-1600', '2-1000', '2-0000'},
                        new List<String>{'2-1670', 'Grants Received in Advance', '2-1600', '2-1000', '2-0000'},
                        new List<String>{'2-1680', 'Grants Repayable to Government Departments', '2-1600', '2-1000', '2-0000'},
                        new List<String>{'2-1690', 'Other Current Liabilities', '2-1600', '2-1000', '2-0000'},
                        
                        //Profitable Trust in Current Liabilities
                        new List<String>{'2-1810', 'PAYG Withholdings Payable', '2-1800', '2-1000', '2-0000'},
                        new List<String>{'2-1820', 'Rounding', '2-1800', '2-1000', '2-0000'},
                        new List<String>{'2-1830', 'Superannuation Payable', '2-1800', '2-1000', '2-0000'},
                        new List<String>{'2-1840', 'Suspense', '2-1800', '2-1000', '2-0000'},
                        new List<String>{'2-1850', 'Unexpired Interest - CL', '2-1800', '2-1000', '2-0000'},
                        new List<String>{'2-1860', 'Wages Payable', '2-1800', '2-1000', '2-0000'},
                        new List<String>{'2-1870', 'Deferred Income', '2-1800', '2-1000', '2-0000'},
                        new List<String>{'2-1880', 'ABN Withholding Tax Payable', '2-1800', '2-1000', '2-0000'},
                       
                        //Non Profit Trust in Non-Current Liabilities
                        new List<String>{'2-2510', 'Hire Purchase Liability- NCL', '2-2500', '2-2000', '2-0000'},
                        new List<String>{'2-2520', 'Loan', '2-2500', '2-2000', '2-0000'},
                        new List<String>{'2-2530', 'Provison for Long Service Leave', '2-2500', '2-2000', '2-0000'},
                        new List<String>{'2-2540', 'Provision for Annual Leave', '2-2500', '2-2000', '2-0000'},
                        new List<String>{'2-2550', 'Other Non-Current Liabilities', '2-2500', '2-2000', '2-0000'},
                         
                        //Profitable Trust in Non-Current Liabilities
                        new List<String>{'2-2610', 'Chattel Mortgage NCL', '2-2600', '2-2000', '2-0000'},
                        new List<String>{'2-2620', 'Beneficiary Loan', '2-2600', '2-2000', '2-0000'},
                        new List<String>{'2-2630', 'Other Long Term Liabilities', '2-2600', '2-2000', '2-0000'},
                        new List<String>{'2-2640', 'Unexpired Interest - NCL', '2-2600', '2-2000', '2-0000'},
                        
                       //  Non Profit Trust in Owner's/Shareholder's Capital
                       new List<String>{'3-1110', 'Asset Revaluation Reserve', '3-1100', '3-1000', '3-0000'},
                       new List<String>{'3-1120', 'Trust Distributions Paid', '3-1100', '3-1000', '3-0000'},
                       // Non Profit Trust in Owner's/Shareholder's Drawings    
                       new List<String>{'3-2110', 'Other Reserves', '3-2100', '3-2000', '3-0000'},
                       new List<String>{'3-2120', 'Member Contributions', '3-2100', '3-2000', '3-0000'},
                       // Profitable Trust in Retained Earnings    
                       new List<String>{'3-3110', 'Retained Earnings', '3-3100', '3-3000', '3-0000'},
                       //Profitable Trust in Current Year Earnings    
                       new List<String>{'3-4110', 'Current Year Earnings', '3-4100', '3-4000', '3-0000'},
                       // Profitable Trust in Historical Balancing    
                       new List<String>{'3-5110', 'Historical Balancing', '3-5100', '3-5000', '3-0000'},
                           
                       //Non Profit Trust in Sales Income #1    
                       new List<String>{'4-1210', 'Interest Income', '4-1200', '4-1000', '4-0000'},
                       new List<String>{'4-1220', 'NDIS Service Income', '4-1200', '4-1000', '4-0000'},   
                       new List<String>{'4-1230', 'NDIS Client Contributions', '4-1200', '4-1000', '4-0000'},
                       new List<String>{'4-1240', 'NDIS Therapy Services', '4-1200', '4-1000', '4-0000'},  
                       new List<String>{'4-1250', 'NDIS Support Coordination', '4-1200', '4-1000', '4-0000'},    
                       new List<String>{'4-1260', 'Grants', '4-1200', '4-1000', '4-0000'},   
                       new List<String>{'4-1270', 'Fundraising Gifts', '4-1200', '4-1000', '4-0000'},
                       new List<String>{'4-1280', 'Fundraising - Contributions - Members', '4-1200', '4-1000', '4-0000'},
                       new List<String>{'4-1290', 'Fundraising - Contributions - Public', '4-1200', '4-1000', '4-0000'},
                       new List<String>{'4-1300', 'Fundraising - Contributions - Government', '4-1200', '4-1000', '4-0000'},
                       new List<String>{'4-1310', 'Sponsorship and licensing fees', '4-1200', '4-1000', '4-0000'}, 
                           
                        //Profitable Trust in Sales Income #1    
                       new List<String>{'4-1410', 'Government Grants (Other than NDIS)', '4-1400', '4-1000', '4-0000'},
                       new List<String>{'4-1420', 'Donations received', '4-1400', '4-1000', '4-0000'},   
                       new List<String>{'4-1430', 'Fundraising', '4-1400', '4-1000', '4-0000'},
                       new List<String>{'4-1440', 'Rental income', '4-1400', '4-1000', '4-0000'},  
                       new List<String>{'4-1450', 'Membership Fees', '4-1400', '4-1000', '4-0000'},    
                       new List<String>{'4-1460', 'Dividends Received', '4-1400', '4-1000', '4-0000'},   
                       new List<String>{'4-1470', 'Special Events', '4-1400', '4-1000', '4-0000'},
                       new List<String>{'4-1480', 'Sales of tickets', '4-1400', '4-1000', '4-0000'},
                       new List<String>{'4-1490', 'Gain on Sale of Non- Current Assets', '4-1400', '4-1000', '4-0000'},
                       new List<String>{'4-1500', 'Other Revenue', '4-1400', '4-1000', '4-0000'},
                       new List<String>{'4-1510', 'Sale of Goods', '4-1400', '4-1000', '4-0000'},
                       
                       //Non Profit Trust in Realised Currency Gains
                       new List<String>{'4-2110', 'Realised Currency Gains', '4-2100', '4-2000', '4-0000'},
                      
                      //Non Profit Trust in General Expenses     
                      new List<String>{'6-1410', 'Accounting Fees', '6-1400', '6-1000', '6-0000'},
                      new List<String>{'6-1420', 'Amortisation Expense', '6-1400', '6-1000', '6-0000'},
                      new List<String>{'6-1430', 'Assets Purchased <$300.00', '6-1400', '6-1000', '6-0000'},
                      new List<String>{'6-1440', 'Audit Fees', '6-1400', '6-1000', '6-0000'},
                      new List<String>{'6-1450', 'Board/Governance Expenses', '6-1400', '6-1000', '6-0000'},
                      new List<String>{'6-1460', 'Client Support Services', '6-1400', '6-1000', '6-0000'},
                      new List<String>{'6-1470', 'Consultancy Fees', '6-1400', '6-1000', '6-0000'},
                      new List<String>{'6-1480', 'Credit Card Fees', '6-1400', '6-1000', '6-0000'},
                      new List<String>{'6-1490', 'Donations', '6-1400', '6-1000', '6-0000'},
                      new List<String>{'6-1500', 'Filing Fees', '6-1400', '6-1000', '6-0000'},
                      new List<String>{'6-1510', 'Fines & Penalties', '6-1400', '6-1000', '6-0000'},
                      new List<String>{'6-1520', 'Fees & Permits', '6-1400', '6-1000', '6-0000'},
                      new List<String>{'6-1530', 'Fundraising Expense', '6-1400', '6-1000', '6-0000'},
                      new List<String>{'6-1540', 'Employment Support and Supervision Costs', '6-1400', '6-1000', '6-0000'},
                      new List<String>{'6-1550', 'Entertainment Costs', '6-1400', '6-1000', '6-0000'},
                      new List<String>{'6-1560', 'Health & Safety', '6-1400', '6-1000', '6-0000'},
                      new List<String>{'6-1570', 'General Expenses', '6-1400', '6-1000', '6-0000'},
                      new List<String>{'6-1580', 'Hire Purchase Charge', '6-1400', '6-1000', '6-0000'},
                      new List<String>{'6-1590', 'Subcontractor Expenses', '6-1400', '6-1000', '6-0000'},
                      
                      //Profitable Trust in General Expenses
                      new List<String>{'6-1610', 'Interest Expense', '6-1600', '6-1000', '6-0000'},
                      new List<String>{'6-1620', 'Loss on Sale of Assets', '6-1600', '6-1000', '6-0000'},
                      new List<String>{'6-1630', 'Light, Power, Heating', '6-1600', '6-1000', '6-0000'},
                      new List<String>{'6-1640', 'Management Fees', '6-1600', '6-1000', '6-0000'},
                      new List<String>{'6-1650', 'Meeting Expense', '6-1600', '6-1000', '6-0000'},
                      new List<String>{'6-1660', 'Membership Fees Paid', '6-1600', '6-1000', '6-0000'},
                      new List<String>{'6-1670', 'Merchant Fees', '6-1600', '6-1000', '6-0000'},
                      new List<String>{'6-1680', 'Office Supplies', '6-1600', '6-1000', '6-0000'},
                      new List<String>{'6-1690', 'Postage, Freight and Courier', '6-1600', '6-1000', '6-0000'},
                      new List<String>{'6-1700', 'Printing & Stationery', '6-1600', '6-1000', '6-0000'},
                      new List<String>{'6-1710', 'Property Management Fees', '6-1600', '6-1000', '6-0000'},
                      new List<String>{'6-1720', 'Publications and Information Resources', '6-1600', '6-1000', '6-0000'},
                      new List<String>{'6-1730', 'Rates & Taxes', '6-1600', '6-1000', '6-0000'},
                      new List<String>{'6-1740', 'Rent', '6-1600', '6-1000', '6-0000'},
                      new List<String>{'6-1750', 'Repairs & Maintenance', '6-1600', '6-1000', '6-0000'},
                      new List<String>{'6-1760', 'Subscriptions & Memberships', '6-1600', '6-1000', '6-0000'},
                      new List<String>{'6-1770', 'Tenancy and Property Supplies and Services', '6-1600', '6-1000', '6-0000'},
                      new List<String>{'6-1780', 'Sundry Expenses', '6-1600', '6-1000', '6-0000'},
                      new List<String>{'6-1790', 'Staff Amenities', '6-1600', '6-1000', '6-0000'},
                      new List<String>{'6-1800', 'Service Subcontractors', '6-1600', '6-1000', '6-0000'},
                      new List<String>{'6-1810', 'Telephone and internet', '6-1600', '6-1000', '6-0000'},
                      new List<String>{'6-1820', 'Travel - International', '6-1600', '6-1000', '6-0000'},
                      
                      //Non Profit Trust in Cost of Goods Sold
                      new List<String>{'6-3110', 'Purchases', '6-3100', '6-3000', '6-0000'},
                      new List<String>{'6-3120', 'Opening Stock', '6-3100', '6-3000', '6-0000'},
                      //Non Profit Trust in Cost of Goods Sold
                      new List<String>{'6-3210', 'Fright Inwards', '6-3200', '6-3000', '6-0000'},
                      new List<String>{'6-3220', 'Less: Closing Stock', '6-3200', '6-3000', '6-0000'},
                          
                      //Non Profit Trust in  Payroll Expenses 
                      new List<String>{'6-4210', 'Annual Leave Expenses', '6-4200', '6-4000', '6-0000'},
                      new List<String>{'6-4220', 'Long Service Leave Expenses', '6-4200', '6-4000', '6-0000'},
                      new List<String>{'6-4230', 'Recruitment Expense', '6-4200', '6-4000', '6-0000'},  
                      new List<String>{'6-4240', 'IT and Software Licenses', '6-4200', '6-4000', '6-0000'},
                      
                      //Profitable Trust in  Payroll Expenses 
                      new List<String>{'6-4310', 'Termination Payments', '6-4300', '6-4000', '6-0000'},
                      new List<String>{'6-4320', 'Workers\' Compensation', '6-4300', '6-4000', '6-0000'},
                      new List<String>{'6-4330', 'Training & Development', '6-4300', '6-4000', '6-0000'},  
                      new List<String>{'6-4340', 'Wages & Salaries', '6-4300', '6-4000', '6-0000'},
                      
                      //Non Profit Trust in Depreciation Expenses
                      new List<String>{'6-6310', 'Depreciation', '6-6300', '6-6000', '6-0000'},
                 
                      //Non Profit Trust in Motor Vehicle Expenses
                      new List<String>{'6-8210', 'Motor Vehicle Expense - Registration & Insurance', '6-8200', '6-8000', '6-0000'},
                      new List<String>{'6-8220', 'Motor Vehicle Expense - Repairs & Maintenance', '6-8200', '6-8000', '6-0000'},
                      //Profitable Trust in  Motor Vehicle Expenses
                      new List<String>{'6-8310', 'Motor Vehicle Expense - Lease Payments', '6-8300', '6-8000', '6-0000'},
                       
                      //Non Profit Trust in Insurance Expenses
                      new List<String>{'6-9210', 'Insurance', '6-9200', '6-9000', '6-0000'},
                     
                      //Non Profit Trust in Unrealised Currency Gains    
                      new List<String>{'8-3110', 'Unrealised Currency Gains', '8-3100', '8-3000', '8-0000'}
                             
                   };
                  ledgerItemData.addAll(NewLedgerItemData);
                  if(company.Industry__c.equals('Companies')) {
                      System.debug('Companies at 815 ===>');
                     NewLedgerItemData.add(new List<String>{'1-1580', 'PAYG Instalments', '1-1500', '1-1000', '1-0000'});
                     NewLedgerItemData.add(new List<String>{'1-1590', 'Trade Debtors', '1-1500', '1-1000', '1-0000'}); 
                     NewLedgerItemData.add(new List<String>{'1-1650', 'GST Paid', '1-1600', '1-1000', '1-0000'}); 
                     NewLedgerItemData.add(new List<String>{'2-1700', 'GST Collected', '2-1600', '2-1000', '2-0000'});
                     NewLedgerItemData.add(new List<String>{'2-1890', 'Income Tax Payable', '2-1800', '2-1000', '2-0000'});
                     NewLedgerItemData.add(new List<String>{'2-1900', 'Trade Creditors', '2-1800', '2-1000', '2-0000'});
                     NewLedgerItemData.add(new List<String>{'2-2650', 'Deferred Tax Liabilities', '2-2600', '2-2000', '2-0000'});
                     NewLedgerItemData.add(new List<String>{'3-1130', 'Owner/Shareholder Capital', '3-1100', '3-1000', '3-0000'});
                     NewLedgerItemData.add(new List<String>{'3-1140', 'Issued Capital', '3-1100', '3-1000', '3-0000'});
                     NewLedgerItemData.add(new List<String>{'3-1150', 'Settlement Sum', '3-1100', '3-1000', '3-0000'});
                     NewLedgerItemData.add(new List<String>{'4-1520', 'NDIS Funding', '4-1400', '4-1000', '4-0000'});
                     NewLedgerItemData.add(new List<String>{'6-4250', 'Software Licenses', '6-4200', '6-4000', '6-0000'});
                     NewLedgerItemData.add(new List<String>{'6-4260', 'Income Tax Expense', '6-4200', '6-4000', '6-0000'});
                      
                     ledgerItemData= NewLedgerItemData;
                   }
                }

                for (List<String> data : ledgerItemData) {
                    system.debug('data===>'+data[0]);
                    Id parentLedgerNameId = ledgerNameIdMap.get(data[2]);
                    Id parentSubCategoryId = subCategoryIdMap.get(data[3]);
                    Id parentCategoryId;
                    if(categoryIdMap.get(data[4])!= null){
                        system.debug('categoryIdMap.get(data[5])===>'+categoryIdMap.get(data[4]));
                       parentCategoryId = categoryIdMap.get(data[4]);
                    }

                    if (parentLedgerNameId != null && parentSubCategoryId != null && parentCategoryId != null) {
                        ledgerItemList.add(new Accounting_Ledger_Items__c(
                            Name = data[1],
                            Account_Number__c = data[0],
                            Ledger_Name__c = parentLedgerNameId,
                            Sub_Category__c = parentSubCategoryId,
                            Category__c = parentCategoryId
                        ));
                    }
                }
            }
        }

        if (!ledgerItemList.isEmpty()) {
            Database.insert(ledgerItemList, false);
        }
    }
}