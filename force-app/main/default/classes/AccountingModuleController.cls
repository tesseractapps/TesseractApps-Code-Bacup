public class AccountingModuleController {
   
    @AuraEnabled(cacheable=true)
    public static List<Map<String, Object>> getAccountingData() {
        List<Map<String, Object>> treeData = new List<Map<String, Object>>();
        
        List<Accounting_Category__c> categories = [SELECT Id, Name, Account_Number__c FROM Accounting_Category__c];
        
        Map<Id, List<Map<String, Object>>> subCategoryMap = new Map<Id, List<Map<String, Object>>>();
        for (Accounting_Sub_Category__c sub : [SELECT Id, Name, Account_Number__c, Category__c FROM Accounting_Sub_Category__c]) {
            if (!subCategoryMap.containsKey(sub.Category__c)) {
                subCategoryMap.put(sub.Category__c, new List<Map<String, Object>>());
            }
            subCategoryMap.get(sub.Category__c).add(new Map<String, Object>{
                'id' => sub.Id,
                    'name' => sub.Name,
                    'accountNumber' => sub.Account_Number__c,
                    'expanded' => false,
                    'iconName' => 'utility:chevronright',
                    'ledgers' => new List<Map<String, Object>>()
                    });
        }
        
        Map<Id, List<Map<String, Object>>> ledgerNameMap = new Map<Id, List<Map<String, Object>>>();
        for (Accounting_Ledger_Name__c ledger : [SELECT Id, Name, Account_Number__c, Sub_Category__c FROM Accounting_Ledger_Name__c]) {
            if (!ledgerNameMap.containsKey(ledger.Sub_Category__c)) {
                ledgerNameMap.put(ledger.Sub_Category__c, new List<Map<String, Object>>());
            }
            ledgerNameMap.get(ledger.Sub_Category__c).add(new Map<String, Object>{
                'id' => ledger.Id,
                    'name' => ledger.Name,
                    'accountNumber' => ledger.Account_Number__c,
                    'expanded' => false,
                    'iconName' => 'utility:chevronright',
                    'items' => new List<Map<String, Object>>()
                    });
        }
        
        Map<Id, List<Map<String, Object>>> ledgerItemMap = new Map<Id, List<Map<String, Object>>>();
        for (Accounting_Ledger_Items__c item : [SELECT Id, Name, Account_Number__c, Ledger_Name__c FROM Accounting_Ledger_Items__c]) {
            if (!ledgerItemMap.containsKey(item.Ledger_Name__c)) {
                ledgerItemMap.put(item.Ledger_Name__c, new List<Map<String, Object>>());
            }
            ledgerItemMap.get(item.Ledger_Name__c).add(new Map<String, Object>{
                'id' => item.Id,
                    'name' => item.Name,
                    'accountNumber' => item.Account_Number__c
                    });
        }
        
        for (Accounting_Category__c category : categories) {
            Map<String, Object> categoryNode = new Map<String, Object>{
                'id' => category.Id,
                    'name' => category.Name,
                    'accountNumber' => category.Account_Number__c,
                    'expanded' => false,
                    'iconName' => 'utility:chevronright',
                    'subCategories' => subCategoryMap.containsKey(category.Id) ? subCategoryMap.get(category.Id) : new List<Map<String, Object>>()
                        };
                            
                            for (Map<String, Object> subCategoryNode : (List<Map<String, Object>>)categoryNode.get('subCategories')) {
                                Id subCategoryId = (Id)subCategoryNode.get('id');
                                
                                if (ledgerNameMap.containsKey(subCategoryId)) {
                                    subCategoryNode.put('ledgers', ledgerNameMap.get(subCategoryId));
                                    
                                    for (Map<String, Object> ledgerNode : (List<Map<String, Object>>)subCategoryNode.get('ledgers')) {
                                        Id ledgerId = (Id)ledgerNode.get('id');
                                        
                                        if (ledgerItemMap.containsKey(ledgerId)) {
                                            ledgerNode.put('items', ledgerItemMap.get(ledgerId));
                                        }
                                    }
                
                                }
                            }
            
            treeData.add(categoryNode);
        }
        
        return treeData;
    }
    
   @AuraEnabled(cacheable=true)
    public static List<Map<String, Object>> getAccountListByCompany(String sDate,String eDate, Id companyId, Boolean isActive) {
        System.debug(' isActive Flag: ' + isActive);
        Date startDate=Date.valueOf(sDate);
        Date endDate=Date.valueOf(eDate);
        System.debug('startDate: ' + startDate);
         System.debug('endDate: ' + endDate);
        List<Map<String, Object>> finalList = new List<Map<String, Object>>();
    
        // Fetch Account Lists for the given Company
        List<Account_List__c> accountLists = [
            SELECT Id, Name, Company__c
            FROM Account_List__c
            WHERE Company__c = :companyId 
            //AND CreatedDate >=:startDate and CreatedDate <=: endDate
        ];
    
        // Fetch Categories related to Account Lists
        Map<Id, List<Accounting_Category__c>> categoryMap = new Map<Id, List<Accounting_Category__c>>();
        for (Accounting_Category__c category : [
            SELECT Id, Name, Account_Number__c, Account_List__c 
            FROM Accounting_Category__c
        ]) {
            if (!categoryMap.containsKey(category.Account_List__c)) {
                categoryMap.put(category.Account_List__c, new List<Accounting_Category__c>());
            }
            categoryMap.get(category.Account_List__c).add(category);
        }
    
        // Fetch Subcategories
        Map<Id, List<Accounting_Sub_Category__c>> subCategoryMap = new Map<Id, List<Accounting_Sub_Category__c>>();
        for (Accounting_Sub_Category__c sub : [
            SELECT Id, Name, Account_Number__c, Category__c 
            FROM Accounting_Sub_Category__c
        ]) {
            if (!subCategoryMap.containsKey(sub.Category__c)) {
                subCategoryMap.put(sub.Category__c, new List<Accounting_Sub_Category__c>());
            }
            subCategoryMap.get(sub.Category__c).add(sub);
        }
    
        // Fetch Ledgers
        Map<Id, List<Accounting_Ledger_Name__c>> ledgerMap = new Map<Id, List<Accounting_Ledger_Name__c>>();
        for (Accounting_Ledger_Name__c ledger : [
            SELECT Id, Name, Account_Number__c, Sub_Category__c 
            FROM Accounting_Ledger_Name__c
        ]) {
            if (!ledgerMap.containsKey(ledger.Sub_Category__c)) {
                ledgerMap.put(ledger.Sub_Category__c, new List<Accounting_Ledger_Name__c>());
            }
            ledgerMap.get(ledger.Sub_Category__c).add(ledger);
        }
    
        // Fetch Ledger Items (with or without amount != 0 based on isActive)
        List<Accounting_Ledger_Items__c> ledgerItems;
    
         if (isActive) {
        	ledgerItems = [
                    SELECT Id, Name, Account_Number__c, Ledger_Name__c, Amount__c, 
                   (SELECT Id, Name, Invoice_Date__c, Amount__c,Total_Amount__c, Accounting_Invoices_Expenses__r.Status__c ,Accounting_Invoices_Expenses__r.Is_RFQ__c 
                        FROM Accounting_Journal_Entry__r
                        WHERE Invoice_Date__c >= :startDate AND Invoice_Date__c <= :endDate AND Accounting_Invoices_Expenses__r.Status__c  !='Draft' 
                   	     AND Accounting_Invoices_Expenses__r.Is_RFQ__c != true)
                    FROM Accounting_Ledger_Items__c
                    WHERE Amount__c != 0 AND Amount__c != null
                ];
             //(SELECT Id,Status__c FROM Accounting_Invoice_Expense__r WHERE Status__c !='Draft')
              for (Accounting_Ledger_Items__c ledgerItem : ledgerItems) {
                System.debug('Ledger Item Name: ' + ledgerItem.Name);
   			    System.debug('Ledger Item Amount: ' + ledgerItem.Amount__c);
                if (ledgerItem.Accounting_Journal_Entry__r != null) {
                    System.debug('Number of Journal Entries: ' + ledgerItem.Accounting_Journal_Entry__r.size());
                    for (Accounting_Journal_Entry__c entry : ledgerItem.Accounting_Journal_Entry__r) {
                        System.debug('Journal Entry ID: ' + entry.Id);
                        System.debug('Invoice Date: ' + entry.Invoice_Date__c);
                        System.debug('Entry Amount: ' + entry.Amount__c);
                    }
                } 
              }
            } else {
                ledgerItems = [
                    SELECT Id, Name, Account_Number__c, Ledger_Name__c, Amount__c,
                       (SELECT Id, Name, Invoice_Date__c, Amount__c,Total_Amount__c , Accounting_Invoices_Expenses__r.Status__c ,Accounting_Invoices_Expenses__r.Is_RFQ__c
                        FROM Accounting_Journal_Entry__r
                        WHERE Invoice_Date__c >= :startDate AND Invoice_Date__c <= :endDate AND Accounting_Invoices_Expenses__r.Status__c  !='Draft' 
                         AND Accounting_Invoices_Expenses__r.Is_RFQ__c != true)
                    FROM Accounting_Ledger_Items__c
                   // WHERE Amount__c != null OR Amount__c != 0 OR Amount__c = null
                ];
            }
              
        System.debug('ledgerItems : ' + ledgerItems);
        Map<Id, Decimal> calculatedAmounts = new Map<Id, Decimal>();

        for (Accounting_Ledger_Items__c ledgerItem : ledgerItems) {
            Decimal sum = 0;
            if (ledgerItem.Accounting_Journal_Entry__r != null) {
                for (Accounting_Journal_Entry__c entry : ledgerItem.Accounting_Journal_Entry__r) {
                    sum += entry.Total_Amount__c != null ? entry.Total_Amount__c : 0;
                }
            }
            calculatedAmounts.put(ledgerItem.Id, sum);
        }

        // Map Ledger Items to their parent Ledger
        Map<Id, List<Accounting_Ledger_Items__c>> ledgerItemMap = new Map<Id, List<Accounting_Ledger_Items__c>>();
        for (Accounting_Ledger_Items__c item : ledgerItems) {
            if (!ledgerItemMap.containsKey(item.Ledger_Name__c)) {
                ledgerItemMap.put(item.Ledger_Name__c, new List<Accounting_Ledger_Items__c>());
            }
            ledgerItemMap.get(item.Ledger_Name__c).add(item);
        }
    
        // Build the full nested data structure
        for (Account_List__c accountList : accountLists) {
            Map<String, Object> accountListData = new Map<String, Object>{
                'accountListName' => accountList.Name,
                'accountListId' => accountList.Id,
                'categories' => new List<Map<String, Object>>()
            };
    
            if (categoryMap.containsKey(accountList.Id)) {
                for (Accounting_Category__c category : categoryMap.get(accountList.Id)) {
                    Map<String, Object> categoryData = new Map<String, Object>{
                        'accountNumber' => category.Account_Number__c,
                        'accountName' => category.Name,
                        'subCategories' => new List<Map<String, Object>>()
                    };
    
                    if (subCategoryMap.containsKey(category.Id)) {
                        for (Accounting_Sub_Category__c sub : subCategoryMap.get(category.Id)) {
                            Map<String, Object> subCategoryData = new Map<String, Object>{
                                'accountNumber' => sub.Account_Number__c,
                                'accountName' => sub.Name,
                                'ledgers' => new List<Map<String, Object>>()
                            };
    
                            if (ledgerMap.containsKey(sub.Id)) {
                                for (Accounting_Ledger_Name__c ledger : ledgerMap.get(sub.Id)) {
                                    // Only include ledgers that have items (when isActive is true)
                                    if (isActive && (!ledgerItemMap.containsKey(ledger.Id) || ledgerItemMap.get(ledger.Id).isEmpty())) {
                                        continue;
                                    }
    
                                    Map<String, Object> ledgerData = new Map<String, Object>{
                                        'accountNumber' => ledger.Account_Number__c,
                                        'accountName' => ledger.Name,
                                        'ledgerItems' => new List<Map<String, Object>>()
                                    };
    
                                    if (ledgerItemMap.containsKey(ledger.Id)) {
                                        for (Accounting_Ledger_Items__c item : ledgerItemMap.get(ledger.Id)) {
                                            Map<String, Object> ledgerItemData = new Map<String, Object>{
                                                'accountNumber' => item.Account_Number__c,
                                                'accountName' => item.Name,
                                                //'amount' => item.Amount__c,
                                                'calculatedAmount' => calculatedAmounts.get(item.Id), 
                                                'Id' => item.Id
                                            };
                                            ((List<Map<String, Object>>)ledgerData.get('ledgerItems')).add(ledgerItemData);
                                              System.debug('ledgerItemData : ' + ledgerItemData);
                                        }
                                    }
    
                                    ((List<Map<String, Object>>)subCategoryData.get('ledgers')).add(ledgerData);
                                }
                            }
    
                            ((List<Map<String, Object>>)categoryData.get('subCategories')).add(subCategoryData);
                        }
                    }
    
                    ((List<Map<String, Object>>)accountListData.get('categories')).add(categoryData);
                }
            }
    
            finalList.add(accountListData);
            System.debug('finalList : ' + finalList);
        }
    
        return finalList;
    }
 @AuraEnabled(cacheable=true)
    public static List<Map<String, Object>> getAccountListByCompanyNew(Id companyId) {
        List<Map<String, Object>> finalList = new List<Map<String, Object>>();
        
        // Fetch Account Lists for the given Company (Account List as the parent)
        List<Account_List__c> accountLists = [
            SELECT Id, Name, Company__c
            FROM Account_List__c
            WHERE Company__c = :companyId
        ];
        
        // Fetch Categories related to Account Lists (Categories as child of Account List)
        Map<Id, List<Accounting_Category__c>> categoryMap = new Map<Id, List<Accounting_Category__c>>();
        for (Accounting_Category__c category : [
            SELECT Id, Name, Account_Number__c, Account_List__c 
            FROM Accounting_Category__c
        ]) {
            if (!categoryMap.containsKey(category.Account_List__c)) {
                categoryMap.put(category.Account_List__c, new List<Accounting_Category__c>());
            }
            categoryMap.get(category.Account_List__c).add(category);
        }
        
        // Fetch Subcategories (Subcategory as a child of Category)
        Map<Id, List<Accounting_Sub_Category__c>> subCategoryMap = new Map<Id, List<Accounting_Sub_Category__c>>();
        for (Accounting_Sub_Category__c sub : [
            SELECT Id, Name, Account_Number__c, Category__c 
            FROM Accounting_Sub_Category__c
        ]) {
            if (!subCategoryMap.containsKey(sub.Category__c)) {
                subCategoryMap.put(sub.Category__c, new List<Accounting_Sub_Category__c>());
            }
            subCategoryMap.get(sub.Category__c).add(sub);
        }
        
        // Fetch Ledgers (Ledger as a child of Subcategory)
        Map<Id, List<Accounting_Ledger_Name__c>> ledgerMap = new Map<Id, List<Accounting_Ledger_Name__c>>();
        for (Accounting_Ledger_Name__c ledger : [
            SELECT Id, Name, Account_Number__c, Sub_Category__c 
            FROM Accounting_Ledger_Name__c
        ]) {
            if (!ledgerMap.containsKey(ledger.Sub_Category__c)) {
                ledgerMap.put(ledger.Sub_Category__c, new List<Accounting_Ledger_Name__c>());
            }
            ledgerMap.get(ledger.Sub_Category__c).add(ledger);
        }
        
        // Fetch Ledger Items (Ledger Item as a child of Ledger)
        Map<Id, List<Accounting_Ledger_Items__c>> ledgerItemMap = new Map<Id, List<Accounting_Ledger_Items__c>>();
        for (Accounting_Ledger_Items__c item : [
            SELECT Id, Name, Account_Number__c, Ledger_Name__c,Amount__c
            FROM Accounting_Ledger_Items__c
        ]) {
            if (!ledgerItemMap.containsKey(item.Ledger_Name__c)) {
                ledgerItemMap.put(item.Ledger_Name__c, new List<Accounting_Ledger_Items__c>());
            }
            ledgerItemMap.get(item.Ledger_Name__c).add(item);
        }
        
        // Build the data structure for Account Lists, Categories, Subcategories, Ledgers, and Ledger Items
        for (Account_List__c accountList : accountLists) {
            Map<String, Object> accountListData = new Map<String, Object>{
                'accountListName' => accountList.Name,
                    'accountListId' => accountList.Id,
                    'categories' => new List<Map<String, Object>>()
                    };
                        
                        // Fetch Categories for this Account List
                        if (categoryMap.containsKey(accountList.Id)) {
                            for (Accounting_Category__c category : categoryMap.get(accountList.Id)) {
                                Map<String, Object> categoryData = new Map<String, Object>{
                                    'accountNumber' => category.Account_Number__c,
                                        'accountName' => category.Name,
                                        'subCategories' => new List<Map<String, Object>>()
                                        };
                                            
                                            // Fetch Subcategories for this Category
                                            if (subCategoryMap.containsKey(category.Id)) {
                                                for (Accounting_Sub_Category__c sub : subCategoryMap.get(category.Id)) {
                                                    Map<String, Object> subCategoryData = new Map<String, Object>{
                                                        'accountNumber' => sub.Account_Number__c,
                                                            'accountName' => sub.Name,
                                                            'ledgers' => new List<Map<String, Object>>()
                                                            };
                                                                
                                                                // Fetch Ledgers for this Subcategory
                                                                if (ledgerMap.containsKey(sub.Id)) {
                                                                    for (Accounting_Ledger_Name__c ledger : ledgerMap.get(sub.Id)) {
                                                                        Map<String, Object> ledgerData = new Map<String, Object>{
                                                                            'accountNumber' => ledger.Account_Number__c,
                                                                                'accountName' => ledger.Name,
                                                                                'ledgerItems' => new List<Map<String, Object>>()
                                                                                };
                                                                                    
                                                                                    // Fetch Ledger Items for this Ledger
                                                                                    if (ledgerItemMap.containsKey(ledger.Id)) {
                                                                                        for (Accounting_Ledger_Items__c item : ledgerItemMap.get(ledger.Id)) {
                                                                                            Map<String, Object> ledgerItemData = new Map<String, Object>{
                                                                                                'accountNumber' => item.Account_Number__c,
                                                                                                    'accountName' => item.Name,
                                                                                                    'amount' => item.Amount__c,
                                                                                                    'Id' => item.Id
                                                                                                    };
                                                                                                        ((List<Map<String, Object>>)ledgerData.get('ledgerItems')).add(ledgerItemData);
                                                                                        }
                                                                                    }
                                                                        
                                                                        ((List<Map<String, Object>>)subCategoryData.get('ledgers')).add(ledgerData);
                                                                    }
                                                                }
                                                    
                                                    ((List<Map<String, Object>>)categoryData.get('subCategories')).add(subCategoryData);
                                                }
                                            }
                                
                                ((List<Map<String, Object>>)accountListData.get('categories')).add(categoryData);
                            }
                        }
            
            finalList.add(accountListData);
        }
        
        return finalList;
    }
    
    
    @AuraEnabled(cacheable=true)
    public static List<Accounting_Ledger_Items__c> getLedgerItems(Id companyId) {
        String currentUserId = UserInfo.getUserId();
        try {
            User currentUser = [SELECT Id, Organization_Name__c FROM User WHERE Id = :currentUserId LIMIT 1];
            List<Accounting_Ledger_Items__c> ledgerItems = [
                SELECT Id, Name, Account_Number__c, Category__r.Name
                FROM Accounting_Ledger_Items__c WHERE Category__r.Account_List__r.Company__r.Organization__r.Name = :currentUser.Organization_Name__c
                AND Category__r.Account_List__r.Company__c = :companyId AND Category__r.Name LIKE '%Income%'
                ORDER BY Account_Number__c ASC
            ];
            System.debug('Retrieved Ledger Items: ' + JSON.serialize(ledgerItems));
            return ledgerItems;
        } catch (Exception e) {
            System.debug(' Error fetching Ledger Items: ' + e.getMessage());
            throw new AuraHandledException('Error retrieving ledger items: ' + e.getMessage());
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Accounting_Ledger_Items__c> getLedgerItemsforExpenses(Id companyId) {
        String currentUserId = UserInfo.getUserId();
        try {
            User currentUser = [SELECT Id, Organization_Name__c FROM User WHERE Id = :currentUserId LIMIT 1];
            List<Accounting_Ledger_Items__c> ledgerItems = [
                SELECT Id, Name, Account_Number__c, Category__r.Name
                FROM Accounting_Ledger_Items__c WHERE Category__r.Account_List__r.Company__r.Organization__r.Name = :currentUser.Organization_Name__c
                AND Category__r.Account_List__r.Company__c = :companyId AND Category__r.Name LIKE '%Expense%'
                ORDER BY Account_Number__c ASC
            ];
            System.debug('Retrieved Ledger Items: ' + JSON.serialize(ledgerItems));
            return ledgerItems;
        } catch (Exception e) {
            System.debug(' Error fetching Ledger Items: ' + e.getMessage());
            throw new AuraHandledException('Error retrieving ledger items: ' + e.getMessage());
        }
    }
    
    @AuraEnabled
    public static void createJournalEntries(Id companyId, Decimal totalAmount, Decimal taxAmount, Decimal subTotal, String selectedItem, 
                                            String description, String entryType, String selectedCardType, String selectedEntityName, 
                                            Boolean taxInclusive, String terms, Date invoiceDate, Date postDate, 
                                            String invoiceNo, String comments, string createdFromExpenses, Boolean isGeneralSales, Decimal amount, string tax) {
                                                system.debug('entryType===>'+entryType);
                                                system.debug('taxInclusive===>'+taxInclusive);
                                                Boolean createdFromExpenses1;
                                               // if(createdFromExpenses == 'true'){
                                                    //createdFromExpenses1 = true;
                                                //} else {
                                                    //createdFromExpenses1 = false;
                                               // }
                                                Accounting_Invoices_Expenses__c invoiceRecord= new Accounting_Invoices_Expenses__c(); 
                                                invoiceRecord = new Accounting_Invoices_Expenses__c(
                                                    // Include_GST__c = taxInclusive,  // Assuming Boolean
                                                    Invoice_Date__c = invoiceDate,
                                                    Invoice_No__c = invoiceNo,
                                                    Post_Date__c = postDate,
                                                    Company__c = companyId,  // Assuming Lookup field  
                                                    Entity_Type__c = 'Expense',
                                                    GST__c = taxAmount,
                                                    Total_Amount__c = totalAmount,
                                                    Sub_Total__c = subTotal
                                                    
                                                );
                                                 system.debug('isGeneralSales===>'+isGeneralSales);
                                                 system.debug('createdFromExpenses===>'+createdFromExpenses);
                                                 if (createdFromExpenses == 'true') {
                                                      createdFromExpenses1 = true;
                                                    invoiceRecord.Is_Payroll_Purchases__c = true;
                                                 } else if (createdFromExpenses == 'false' && isGeneralSales== false){
                                                    createdFromExpenses1 = false;
                                                    invoiceRecord.Is_General_Ledger_Purchases__c = true;
                                                } else if (createdFromExpenses == 'false' && isGeneralSales== true){
                                                   
                                                    invoiceRecord.Is_General_Ledger_Sales__c = true;
                                                    invoiceRecord.Entity_Type__c = 'Invoice';
                                                }
                                               
                                                insert invoiceRecord;
                                                system.debug('invoiceRecord===>'+invoiceRecord);
                                                try {
                                                    System.debug('companyId: ' + companyId);
                                                    System.debug('totalAmount: ' + totalAmount);
                                                    System.debug('taxAmount: ' + taxAmount);
                                                    System.debug('subtotal: ' + subTotal);
                                                    System.debug('selectedItem: ' + selectedItem);
                                                    System.debug('description: ' + description);
                                                    if (String.isNotBlank(tax)) {
                                                        // Remove the '%' symbol if it exists
                                                        tax = tax.replace('%', '');
                                                    }
                                                    
                                                    if(entryType == 'Sales'){
                                                        
                                                        // Retrieve ledger items for categories: Income, Liability (GST Paid), and Assets (Trade Debtors)
                                                        List<Accounting_Ledger_Items__c> ledgerItems = [
                                                            SELECT Id, Name, Category__r.Name
                                                            FROM Accounting_Ledger_Items__c
                                                            WHERE Category__r.Name IN ('Income', 'Liabilities', 'Assets')
                                                            AND Category__r.Account_List__r.Company__c = :companyId
                                                        ];
                                                        
                                                        //System.debug('ledgerItems: ' + ledgerItems);
                                                        
                                                        // Initialize variables to hold ledger items for specific categories
                                                        Accounting_Ledger_Items__c incomeLedger = null;
                                                        Accounting_Ledger_Items__c liabilityLedger = null;
                                                        Accounting_Ledger_Items__c assetsLedger = null;
                                                        
                                                        // Loop through ledger items and assign them to respective variables
                                                        for (Accounting_Ledger_Items__c item : ledgerItems) {
                                                            //System.debug('Checking item: ' + item.Name);
                                                            if (item.Category__r.Name == 'Income' && item.Name == selectedItem) {
                                                                incomeLedger = item;
                                                            } else if (item.Category__r.Name == 'Liabilities' && item.Name == 'GST Collected') {
                                                                liabilityLedger = item;
                                                            } else if (item.Category__r.Name == 'Assets' && item.Name == 'Trade Debtors') {
                                                                assetsLedger = item;
                                                            }
                                                        }
                                                        
                                                        // Ensure that all required ledger items are found
                                                        if (incomeLedger != null && liabilityLedger != null && assetsLedger != null) {
                                                            List<Accounting_Journal_Entry__c> journalEntries = new List<Accounting_Journal_Entry__c>();
                                                            
                                                            // Journal Entry for GST Collected (Liability category)
                                                            if (taxAmount > 0) {
                                                                journalEntries.add(new Accounting_Journal_Entry__c(
                                                                    Tax_Amount__c = 0,
                                                                    Total_Amount__c = taxAmount,
                                                                    Sub_Total__c = 0,
                                                                    Accounting_Ledger_Items__c = liabilityLedger.Id,
                                                                    Description__c = description,
                                                                    Company__c = companyId,
                                                                    Entry_Type__c=entryType,
                                                                    Entity_Profile__c=selectedEntityName,
                                                                    Tax_Inclusive__c = taxInclusive,
                                                                    Terms__c =terms,
                                                                    Invoice_Date__c = invoiceDate,
                                                                    Post_Date__c = postDate,
                                                                    Invoice_No__c = invoiceNo,
                                                                    Comments__c = comments,
                                                                    Accounting_Invoices_Expenses__c = invoiceRecord.Id
                                                                ));
                                                            }
                                                            
                                                            // Journal Entry for Trade Debtors (Assets category)
                                                            journalEntries.add(new Accounting_Journal_Entry__c(
                                                                Tax_Amount__c = 0,
                                                                Total_Amount__c = totalAmount,
                                                                Sub_Total__c = 0,
                                                                Accounting_Ledger_Items__c = assetsLedger.Id,
                                                                Description__c = description,
                                                                Company__c = companyId,
                                                                Entry_Type__c=entryType,
                                                                Entity_Profile__c=selectedEntityName,
                                                                Tax_Inclusive__c = taxInclusive,
                                                                Terms__c =terms,
                                                                Invoice_Date__c = invoiceDate,
                                                                Post_Date__c = postDate,
                                                                Invoice_No__c = invoiceNo,
                                                                Comments__c = comments,
                                                                Accounting_Invoices_Expenses__c = invoiceRecord.Id
                                                            ));
                                                            
                                                            // Journal Entry for Income (selectedItem from UI)
                                                            system.debug('incomeLedger.Id >> '+incomeLedger.Id);
                                                            journalEntries.add(new Accounting_Journal_Entry__c(
                                                                Tax_Amount__c = taxAmount,
                                                                Total_Amount__c = subTotal,
                                                                Sub_Total__c = 0,
                                                                Accounting_Ledger_Items__c = incomeLedger.Id,
                                                                Description__c = description,
                                                                Company__c = companyId,
                                                                Entry_Type__c=entryType,
                                                                Entity_Profile__c=selectedEntityName,
                                                                Tax_Inclusive__c = taxInclusive,
                                                                Terms__c =terms,
                                                                Invoice_Date__c = invoiceDate,
                                                                Post_Date__c = postDate,
                                                                Invoice_No__c = invoiceNo,
                                                                Comments__c = comments,
                                                                Amount__c = subTotal,
                                                                Tax__c = Decimal.valueOf(tax),
                                                            
                                                                Accounting_Invoices_Expenses__c = invoiceRecord.Id
                                                            ));
                                                            
                                                            // Insert the journal entries
                                                            insert journalEntries;
                                                            
                                                            System.debug('Journal Entries Created: ' + JSON.serialize(journalEntries));
                                                        } 
                                                    }
                                                    else if (entryType == 'Purchases'){
                                                        
                                                        // Retrieve ledger items for categories: Income, Liability (GST Paid), and Assets (Trade Debtors)
                                                        List<Accounting_Ledger_Items__c> ledgerItems1 = [
                                                            SELECT Id, Name, Category__r.Name
                                                            FROM Accounting_Ledger_Items__c
                                                            WHERE Category__r.Name IN ('Expenses', 'Liabilities', 'Assets')
                                                            AND Category__r.Account_List__r.Company__c = :companyId
                                                        ];
                                                        
                                                        System.debug('ledgerItems1: ' + ledgerItems1);
                                                        
                                                        // Initialize variables to hold ledger items for specific categories
                                                        Accounting_Ledger_Items__c incomeLedger1 = null;
                                                        Accounting_Ledger_Items__c liabilityLedger1 = null;
                                                        Accounting_Ledger_Items__c assetsLedger1 = null;
                                                        
                                                        // Loop through ledger items and assign them to respective variables
                                                        for (Accounting_Ledger_Items__c item : ledgerItems1) {
                                                            System.debug('Checking item: ' + item.Name);
                                                            if (item.Category__r.Name == 'Expenses' && item.Name == selectedItem) {
                                                                incomeLedger1 = item;
                                                            } else if (item.Category__r.Name == 'Liabilities' && item.Name == 'Trade Creditors') {
                                                                liabilityLedger1 = item;
                                                            } else if (item.Category__r.Name == 'Assets' && item.Name == 'GST Paid') {
                                                                assetsLedger1 = item;
                                                            }
                                                        }
                                                        
                                                        // Ensure that all required ledger items are found
                                                        if (incomeLedger1 != null && liabilityLedger1 != null && assetsLedger1 != null) {
                                                            List<Accounting_Journal_Entry__c> journalEntries = new List<Accounting_Journal_Entry__c>();
                                                            
                                                            // Journal Entry for GST Paid (Assets category)
                                                            if (taxAmount > 0) { 
                                                                journalEntries.add(new Accounting_Journal_Entry__c(
                                                                Tax_Amount__c = 0,
                                                                Total_Amount__c = taxAmount,
                                                                Sub_Total__c = 0,
                                                                Accounting_Ledger_Items__c = assetsLedger1.Id,
                                                                Description__c = description,
                                                                Company__c = companyId,
                                                                Entry_Type__c=entryType,
                                                                Entity_Profile__c=selectedEntityName,
                                                                Tax_Inclusive__c = taxInclusive,
                                                                Terms__c =terms,
                                                                Invoice_Date__c = invoiceDate,
                                                                Post_Date__c = postDate,
                                                                Invoice_No__c = invoiceNo,
                                                                Comments__c = comments,
                                                                Accounting_Invoices_Expenses__c = invoiceRecord.Id
                                                            ));
                                                            }
                                                            
                                                            // Journal Entry for Trade Debtors (liability category)
                                                            journalEntries.add(new Accounting_Journal_Entry__c(
                                                                    Tax_Amount__c = 0,
                                                                    Total_Amount__c = totalAmount,
                                                                    Sub_Total__c = 0,
                                                                    Accounting_Ledger_Items__c = liabilityLedger1.Id,
                                                                    Description__c = description,
                                                                    Company__c = companyId,
                                                                    Entry_Type__c=entryType,
                                                                    Entity_Profile__c=selectedEntityName,
                                                                    Tax_Inclusive__c = taxInclusive,
                                                                    Terms__c =terms,
                                                                    Invoice_Date__c = invoiceDate,
                                                                    Post_Date__c = postDate,
                                                                    Invoice_No__c = invoiceNo,
                                                                    Comments__c = comments,
                                                                    Accounting_Invoices_Expenses__c = invoiceRecord.Id
                                                                ));
                                                            
                                                            // Journal Entry for Income (selectedItem from UI)
                                                            journalEntries.add(new Accounting_Journal_Entry__c(                                                             
                                                                Total_Amount__c = subTotal,
                                                                    Sub_Total__c = 0,
                                                                    Accounting_Ledger_Items__c =  incomeLedger1.Id,
                                                                    Description__c = description,
                                                                    Company__c = companyId,
                                                                    Entry_Type__c=entryType,
                                                                    Entity_Profile__c=selectedEntityName,
                                                                    Tax_Inclusive__c = taxInclusive,
                                                                    Terms__c =terms,
                                                                    Invoice_Date__c = invoiceDate,
                                                                    Post_Date__c = postDate,
                                                                    Invoice_No__c = invoiceNo,
                                                                    Comments__c = comments,
                                                                    Amount__c = totalAmount,
                                                                    Tax_Amount__c = taxAmount,
                                                                    Created_From_Expenses__c = createdFromExpenses1,
                                                                    Tax__c = Decimal.valueOf(tax),
                                                                    Accounting_Invoices_Expenses__c = invoiceRecord.Id
                                                            ));
                                                            
                                                            
                                                            
                                                            // Insert the journal entries
                                                            insert journalEntries;
                                                            
                                                            for (Accounting_Journal_Entry__c je : journalEntries) {
                                                                System.debug('Preparing to insert Journal Entry: ' + je);
                                                            }
                                                            
                                                            System.debug('Journal Entries Created: ' + JSON.serialize(journalEntries));
                                                            
                                                        }
                                                    }
                                                    else {
                                                        throw new AuraHandledException('Required ledger items not found.');
                                                    }
                                                } catch (Exception e) {
                                                    System.debug('Error creating journal entries: ' + e.getMessage());
                                                    throw new AuraHandledException('Error creating journal entries: ' + e.getMessage());
                                                }
                                            }
    
    
    @AuraEnabled(cacheable=true)
    public static List<Accounting_Journal_Entry__c> getRelatedRecords(String sDate, String eDate, String itemId) {
        System.debug('itemId: ' + itemId);
        System.debug('sDate: ' + sDate);
        System.debug('eDate: ' + eDate);
        Date startDate=Date.valueOf(sDate);
        Date endDate=Date.valueOf(eDate);
        System.debug('startDate: ' + startDate);
        System.debug('endDate: ' + endDate);
        
        
        List<Accounting_Journal_Entry__c> entries =  [SELECT Id, Name, Total_Amount__c, Entry_Type__c,Accounting_Ledger_Items__c,Company__r.Company_Name__c,Description__c,
                                                      Accounting_Ledger_Items__r.Name,Accounting_Ledger_Items__r.Category__r.Name,Accounting_Ledger_Items__r.Sub_Category__r.Name,
                                                      Accounting_Ledger_Items__r.Ledger_Name__r.Name, Entity_Profile__r.Card_Type__c, Entity_Profile__r.Designation__c, Accounting_Invoices_Expenses__r.Status__c, Accounting_Invoices_Expenses__r.Is_RFQ__c ,
                                                      Entity_Profile__r.First_Name__c, Entity_Profile__r.Last_Name__c, Entity_Profile__r.Name__c,Entity_Profile__r.Company__r.Organisation__r.Name,
                                                      CreatedDate ,Invoice_Date__c FROM Accounting_Journal_Entry__c WHERE Accounting_Ledger_Items__c = :itemId 
                                                      AND Invoice_Date__c >= :startDate AND Invoice_Date__c <= :endDate AND Accounting_Invoices_Expenses__r.Status__c  !='Draft' 
                                                     AND Accounting_Invoices_Expenses__r.Is_RFQ__c != true ];
        System.debug('entries: ' + entries);
        return entries;
    }
    /*@AuraEnabled(cacheable=true)
    public static Decimal getEntityProfileTax(String entityId) {
        try {
            // Query the Entity_Profile__c by its ID and retrieve related Entity_Sellings__r and Entity_Buyings__r records
            Entity_Profile__c entityProfile = [SELECT Id, Card_Type__c, 
                                               (SELECT Tax__c, AccountList__c FROM Entity_Selling__r LIMIT 1),
                                               (SELECT Tax__c, AccountList__c FROM Entity_Buying__r LIMIT 1)
                                               FROM Entity_Profile__c 
                                               WHERE Id = :entityId LIMIT 1];
            
            Decimal tax;
            String accountList;
            
            // Based on the Card Type, fetch the tax from the related entity
            if (entityProfile.Card_Type__c == 'Customer' && entityProfile.Entity_Selling__r.size() > 0) {
                tax = entityProfile.Entity_Selling__r[0].Tax__c; // Get tax from Entity_Sellings__r if card type is 'Customer'
                accountList = entityProfile.Entity_Selling__r[0].AccountList__c;
            } else if (entityProfile.Card_Type__c == 'Supplier' && entityProfile.Entity_Buying__r.size() > 0) {
                tax = entityProfile.Entity_Buying__r[0].Tax__c; // Get tax from Entity_Buyings__r if card type is 'Supplier'
                accountList = entityProfile.Entity_Buying__r[0].AccountList__c; 
            }
            
            return tax;  // Return the tax value
        } catch (Exception e) {
            System.debug('Error fetching tax: ' + e.getMessage());
            return null;  // Return null if there's an error
        }
    }*/
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getEntityProfileTax(String entityId) {
        Map<String, Object> result = new Map<String, Object>();
    
        try {
            Entity_Profile__c entityProfile = [
                SELECT Id, Card_Type__c,Email__c,
                    (SELECT Tax__c, AccountList__c,Accounting_Ledger_Items__c FROM Entity_Selling__r LIMIT 1),
                    (SELECT Tax__c, AccountList__c, Accounting_Ledger_Items__c FROM Entity_Buying__r LIMIT 1)
                FROM Entity_Profile__c
                WHERE Id = :entityId
                LIMIT 1
            ];
            result.put('email', entityProfile.Email__c);
            if (entityProfile.Card_Type__c == 'Customer' && entityProfile.Entity_Selling__r.size() > 0) {
                result.put('tax', entityProfile.Entity_Selling__r[0].Tax__c);
                result.put('accountList', entityProfile.Entity_Selling__r[0].AccountList__c);
                result.put('accountItemId', entityProfile.Entity_Selling__r[0].Accounting_Ledger_Items__c);
            } else if (entityProfile.Card_Type__c == 'Supplier' && entityProfile.Entity_Buying__r.size() > 0) {
                result.put('tax', entityProfile.Entity_Buying__r[0].Tax__c);
                result.put('accountList', entityProfile.Entity_Buying__r[0].AccountList__c);
                result.put('accountItemId', entityProfile.Entity_Buying__r[0].Accounting_Ledger_Items__c);
            }
    
            return result;
    
        } catch (Exception e) {
            System.debug('Error fetching entity profile tax and account: ' + e.getMessage());
            return null;
        }
    }

   
    @AuraEnabled
    public static Map<String, Object> getCompanyOnEdit(String companyId) {
        try {
            // Log the start of the query
            System.debug('Fetching company record for Company ID: ' + companyId);
            
            // Fetching the company record with related Financial Year and Account List child records
            List<Company__c> companyRecord = [SELECT Id, Company_Name__c, 
                                        (SELECT Id, Financial_Year__c, End_Month__c, Company__c FROM Financial_Year__r),
                                        (SELECT Id, Industry__c, Company__c FROM Account_List__r),
                                        (SELECT Id, GST_Accounting_Method__c,Tax_File_Number__c, GST_Calculation__c,PAYG_Withheld_Period__c,PAYG_Income_Tax_Method__c,Fringe_Benefits_Tax__c,
                                         Fuel_Tax_Credits__c,Wine_Equalisation_Tax__c,For_Sales__c,For_Purchases__c,Company__c FROM BAS_and_IASs__r)
                                        FROM Company__c WHERE Id = :companyId LIMIT 1];
            
            // Log the result of the query
            System.debug('Company record fetched: ' + companyRecord[0]);
            
            // Prepare the response map
            Map<String, Object> response = new Map<String, Object>();
            response.put('company', companyRecord[0]);
            
            // Get all companies for the dropdown, we don't need another query here if you already have the company data
            List<Company__c> companyOptions = new List<Company__c>{companyRecord[0]};  // Using the existing companyRecord
                response.put('companyOptions', companyOptions);
            
            return response;
            
        } catch (Exception e) {
            System.debug('Error fetching company data: ' + e.getMessage());
            throw new AuraHandledException('Error fetching company data: ' + e.getMessage());
        }
    }
    
    @AuraEnabled
    public static void updateCompany(Map<String, Object> companyData) {
        try {
            
            System.debug('Received Company Data: ' + companyData);
            // Extract user details from the map
            String selectedId = (String) companyData.get('selectedId');
            String selectedYear = (String) companyData.get('selectedYear');
            String selectedEndMonth = (String) companyData.get('selectedEndMonth');
            //String selectedStartMonth = (String) companyData.get('selectedStartMonth');
            // String selectedcomp1 = (String) companyData.get('selectedcomp1');// Extract user details from the map
            //String selectedcomp2 = (String) companyData.get('selectedcomp2');
            //String selectedIndustry = (String) companyData.get('selectedIndustry');
            
            String gstAccountingMethod = (String) companyData.get('gstAccountingMethod');
            String taxFileNumber = (String) companyData.get('taxFileNumber');
            String gstCalculation = (String) companyData.get('gstCalculation');
            String paygWithheldPriod = (String) companyData.get('paygWithheldPriod');
            String paygIncomeTaxMethod = (String) companyData.get('paygIncomeTaxMethod');
            Boolean isFringeBenefitsTax = (Boolean) companyData.get('isFringeBenefitsTax');
            Boolean isFuelTaxCredits = (Boolean) companyData.get('isFuelTaxCredits');
            Boolean isWineEqualisationTax = (Boolean) companyData.get('isWineEqualisationTax');
            String forSales = (String) companyData.get('forSales');
            String forPurchases = (String) companyData.get('forPurchases');
            
            System.debug('selectedEndMonth: ' + selectedEndMonth);
            
            List<Company__c> companyToUpdate = [SELECT Id, Company_Name__c FROM Company__c WHERE Id = :selectedId LIMIT 1];
            System.debug('companyToUpdate: ' + companyToUpdate);
            List<Financial_Year__c> fyToUpdate = [SELECT Id, Financial_Year__c, Start_Month__c ,End_Month__c, Company__c  FROM Financial_Year__c WHERE Company__c = :selectedId];
            System.debug('fyToUpdate: ' + fyToUpdate);
            if (!fyToUpdate.isEmpty()) {
                Financial_Year__c fy = new Financial_Year__c(
                    Id=fyToUpdate[0].Id,
                    Company__c=selectedId,
                    //Start_Month__c=selectedStartMonth,
                    End_Month__c=selectedEndMonth,
                    Financial_Year__c=selectedYear
                );
                update fy;
            }
            List<Account_List__c> accountListToUpdate = [SELECT Id, Industry__c,  Company__c  FROM Account_List__c WHERE Company__c = :selectedId];
            System.debug('accountListToUpdate: ' + accountListToUpdate);
            if (!fyToUpdate.isEmpty()) {
                Account_List__c al = new Account_List__c(
                    Id=accountListToUpdate[0].Id,
                    Company__c=selectedId
                    //Industry__c=selectedIndustry
                );
                update al;
            }
            List<BAS_and_IAS__c> asToUpdate = [SELECT Id, GST_Accounting_Method__c,Tax_File_Number__c, GST_Calculation__c,PAYG_Withheld_Period__c,PAYG_Income_Tax_Method__c,Fringe_Benefits_Tax__c,
                                         Fuel_Tax_Credits__c,Wine_Equalisation_Tax__c,For_Sales__c,For_Purchases__c, Company__c  FROM BAS_and_IAS__c WHERE Company__c = :selectedId];
            System.debug('asToUpdate: ' + asToUpdate);
            if (!asToUpdate.isEmpty()) {
                BAS_and_IAS__c statement = new BAS_and_IAS__c(
                    Id=asToUpdate[0].Id,
                    Company__c=selectedId,
                    GST_Accounting_Method__c=gstAccountingMethod,
                    Tax_File_Number__c=taxFileNumber,
                    GST_Calculation__c=gstCalculation,
                    PAYG_Withheld_Period__c=paygWithheldPriod,
                    PAYG_Income_Tax_Method__c=paygIncomeTaxMethod,
                    Fringe_Benefits_Tax__c=isFringeBenefitsTax,
                    Fuel_Tax_Credits__c=isFuelTaxCredits,
                    Wine_Equalisation_Tax__c=isWineEqualisationTax,
                    For_Sales__c=forSales,
                    For_Purchases__c=forPurchases
                );
                update statement;
            }
        } catch (Exception e) {
            // Log error message and return error response
            System.debug('Error updating company: ' + e.getMessage());
            
        }
    }
    /* @AuraEnabled(cacheable=true)
public static Entity_Profile__c getEntityOnEdit(String recordId) {
try {
// Log the start of the query
System.debug('Fetching recordId of Entity: ' + recordId);

// Fetching the company record with related Financial Year and Account List child records
Entity_Profile__c companyRecord = [SELECT Id, Name__c,First_Name__c,Last_Name__c, Card_Type__c, Contact__c,Designation__c, Company__c,Address__c,Address_Latest__Street__s,Address_Latest__City__s,Address_Latest__StateCode__s,Address_Latest__PostalCode__s,
(SELECT Id,Tax_Code__c, Entity_Profile__c FROM Entity_Buying__r), 
(SELECT Id,Tax_Code__c, Entity_Profile__c FROM Entity_Selling__r),
(SELECT Id, Entity_Profile__c FROM Entity_Selling_Payment__r), 
(SELECT Id, Entity_Profile__c FROM Entity_Payment__r)
FROM Entity_Profile__c WHERE Id = :recordId LIMIT 1];
return companyRecord;
} catch (Exception e) {
System.debug('Error fetching company data: ' + e.getMessage());
throw new AuraHandledException('Error fetching company data: ' + e.getMessage());
}
}*/
    @AuraEnabled
    public static Map<String, Object> getEntityOnEdit(Id recordId) {
        // Fetch the Entity_Profile__c record to get the Card_Type__c
        Entity_Profile__c companyRecord = [SELECT Id, Name__c, Card_Type__c ,Company__c, Designation__c,Email__c,Fax__c,First_Name__c,
                                           Last_Name__c,Contact__c,Address_Latest__Street__s,Address_Latest__City__s,Address_Latest__StateCode__s, Address_Latest__PostalCode__s FROM Entity_Profile__c 
                                           WHERE Id = :recordId LIMIT 1];
        
        List<Entity_Buying__c> entityBuyingRecords = new List<Entity_Buying__c>();
        List<Entity_Selling__c> entitySellingRecords = new List<Entity_Selling__c>();
        List<Entity_Selling_Payment__c> entitySellingPaymentRecords = new List<Entity_Selling_Payment__c>();
        List<Entity_Buying_Payment__c> entityPaymentRecords = new List<Entity_Buying_Payment__c>();
        
        if (companyRecord.Card_Type__c == 'Customer') {
            // If Card_Type__c is Customer, fetch related Entity_Selling__r and Entity_Selling_Payment__r
            entitySellingRecords = [SELECT Id, Tax_Code__c, Entity_Profile__c,AccountList__c,Accounting_Ledger_Items__c,Tax__c FROM Entity_Selling__c WHERE Entity_Profile__c = :recordId];
            entitySellingPaymentRecords = [SELECT Id, Entity_Profile__c FROM Entity_Selling_Payment__c WHERE Entity_Profile__c = :recordId];
        } else if (companyRecord.Card_Type__c == 'Supplier') {
            // If Card_Type__c is Supplier, fetch related Entity_Buying__r and Entity_Payment__r
            entityBuyingRecords = [SELECT Id, Tax_Code__c, Entity_Profile__c,AccountList__c,Accounting_Ledger_Items__c,Tax__c	 FROM Entity_Buying__c WHERE Entity_Profile__c = :recordId];
            entityPaymentRecords = [SELECT Id, Entity_Profile__c FROM Entity_Buying_Payment__c WHERE Entity_Profile__c = :recordId];
        }
        
        // Return a map containing the company record and its related child records
        Map<String, Object> result = new Map<String, Object>();
        result.put('companyRecord', companyRecord);
        result.put('entityBuyingRecords', entityBuyingRecords);
        result.put('entitySellingRecords', entitySellingRecords);
        result.put('entitySellingPaymentRecords', entitySellingPaymentRecords);
        result.put('entityPaymentRecords', entityPaymentRecords);
        
        return result;
    }
    
    
    @AuraEnabled(cacheable=true)
    public static List<Accounting_Invoices_Expenses__c> getAccountingInvoice(String sDate,String eDate ,Id companyId,  Boolean isRFQ) {
        // Initialize a list to hold the result
        System.debug('isRFQ in getAccountingInvoice :'+isRFQ );
        List<Accounting_Invoices_Expenses__c> InvoiceData = new List<Accounting_Invoices_Expenses__c>();
        Date startDate=Date.valueOf(sDate);
        Date endDate=Date.valueOf(eDate);
         List<Accounting_Journal_Entry__c> entryData = [select Id,Tax_Amount__c,Total_Amount__c,Sub_Total__c,Accounting_Ledger_Items__c,Description__c,Company__c,Entry_Type__c,Entity_Profile__c,Invoice_Date__c,
                                                        Post_Date__c,Invoice_No__c,Comments__c,Sl_no__c,Accounting_Ledger_Items__r.Account_Number__c,Accounting_Ledger_Items__r.Name,
                                                       Unit_Price__c,Quantity__c,Tax__c,Accounting_Invoices_Expenses__c,Entity_Profile__r.First_Name__c,Entity_Profile__r.Last_Name__c,Entity_Profile__r.Name__c from Accounting_Journal_Entry__c  WHERE Sl_no__c != NULL];
        List<Id> accountingInvoiceIds = new List<Id>(); // To hold Accounting_Invoices_Expenses__c Ids

        // Loop through entryData and add the unique Accounting_Invoices_Expenses__c Ids to the list
        for (Accounting_Journal_Entry__c entry : entryData) {
            if (entry.Accounting_Invoices_Expenses__c != null) {
                accountingInvoiceIds.add(entry.Accounting_Invoices_Expenses__c);
            }
        }
        if (companyId != null && isRFQ==false) {
            // If selectedId is provided, fetch the company with that specific ID
            InvoiceData = [SELECT Id,Name,Company__c,Status__c ,GST__c,Total_Amount__c,Company__r.Company_Name__c,Invoice_Date__c,New_Format_Invoice_No__c, Amazon_URL__c,Is_Payroll_Sales__c,(select Id,
                                                                                                                                                 Tax_Amount__c,Total_Amount__c,Sub_Total__c,Accounting_Ledger_Items__c,Description__c,Company__c,Entry_Type__c,Entity_Profile__c,Invoice_Date__c,Post_Date__c,Invoice_No__c,Comments__c,Sl_no__c,Accounting_Ledger_Items__r.Account_Number__c,Accounting_Ledger_Items__r.Name,
                                                                                                                                                 Unit_Price__c,Quantity__c,Tax__c,Accounting_Invoices_Expenses__c,Entity_Profile__r.First_Name__c,Entity_Profile__r.Last_Name__c,Entity_Profile__r.Name__c,Accounting_Ledger_Items__r.Category__r.Name  from Accounting_Journal_Entry__r  WHERE Sl_no__c != NULL)
                           FROM Accounting_Invoices_Expenses__c 
                           WHERE Id IN :accountingInvoiceIds  AND Company__c = :companyId AND Invoice_Date__c >=:startDate and Invoice_Date__c <=: endDate AND Is_RFQ__c = :isRFQ  AND Is_Payroll_Sales__c = true ORDER BY createddate DESC];
            System.debug('InvoiceData for companyId: ' + JSON.serialize(InvoiceData));
        } else  if(companyId != null && isRFQ==true){
            InvoiceData = [SELECT Id,Name,Company__c,Status__c ,GST__c,Total_Amount__c,Company__r.Company_Name__c,Invoice_Date__c,New_Format_Invoice_No__c,Amazon_URL__c,Is_Payroll_Sales__c,(select Id,
                                                                                                                                                 Tax_Amount__c,Total_Amount__c,Sub_Total__c,Accounting_Ledger_Items__c,Description__c,Company__c,Entry_Type__c,Entity_Profile__c,Invoice_Date__c,Post_Date__c,Invoice_No__c,Comments__c,Sl_no__c,Accounting_Ledger_Items__r.Account_Number__c,Accounting_Ledger_Items__r.Name,
                                                                                                                                                 Unit_Price__c,Quantity__c,Tax__c,Accounting_Invoices_Expenses__c,Entity_Profile__r.First_Name__c,Entity_Profile__r.Last_Name__c,Entity_Profile__r.Name__c, Accounting_Ledger_Items__r.Category__r.Name from Accounting_Journal_Entry__r  WHERE Sl_no__c != NULL)
                           FROM Accounting_Invoices_Expenses__c 
                           WHERE Id IN :accountingInvoiceIds  AND Company__c = :companyId AND Invoice_Date__c >=:startDate and Invoice_Date__c <=: endDate AND Is_RFQ__c = :isRFQ ORDER BY createddate DESC];
            System.debug('InvoiceData for companyId: ' + JSON.serialize(InvoiceData));
            
        }
        
        return InvoiceData;
    }
    
    @AuraEnabled
    public static List<Accounting_Invoices_Expenses__c> getAccountingInvoiceById(String invoiceId) {
        // Initialize a list to hold the result
        List<Accounting_Invoices_Expenses__c> InvoiceData = new List<Accounting_Invoices_Expenses__c>();
        
        if (invoiceId != null) {
            // If selectedId is provided, fetch the company with that specific ID
            InvoiceData = [SELECT Id,Name,Company__c,Status__c ,GST__c,Total_Amount__c,Company__r.Company_Name__c,Company__r.ABN__c,Company__r.Address__c,Company__r.Phone_Number__c,Invoice_Date__c,(select Id,
                                                                                                                                                                                                      Tax_Amount__c,Total_Amount__c,Sub_Total__c,Accounting_Ledger_Items__c,Description__c,Company__c,Entry_Type__c,Entity_Profile__c,Invoice_Date__c,Post_Date__c,Invoice_No__c,Comments__c,Line_Items__c,
                                                                                                                                                                                                      Unit_Price__c,Quantity__c,Tax__c from Accounting_Journal_Entry__r where Unit_Price__c != null and Quantity__c != null and Tax__c != null )
                           FROM Accounting_Invoices_Expenses__c 
                           WHERE Id =: invoiceId];
            System.debug('InvoiceData for companyId: ' + JSON.serialize(InvoiceData));
        }
        
        return InvoiceData;
    }
    
    @AuraEnabled
    public static Accounting_Invoices_Expenses__c UpdateDataFromInvoice(
        String salesEntryJson,
        String salesEntryListJson,
        String amountEntryJson,
        Boolean isRFQ,
        Boolean isParticipantInvoice
    ) {
        Accounting_Invoices_Expenses__c invoiceRecord = new Accounting_Invoices_Expenses__c();
        List<Accounting_Journal_Entry__c> journalEntriesToUpdate = new List<Accounting_Journal_Entry__c>();
        List<Accounting_Journal_Entry__c> journalEntriesToInsert = new List<Accounting_Journal_Entry__c>();
        
        try {
            System.debug('🔵 Step 1: Incoming Parameters');
            System.debug('➡ salesEntryJson: ' + salesEntryJson);
            System.debug('➡ salesEntryListJson: ' + salesEntryListJson);
            System.debug('➡ amountEntryJson: ' + amountEntryJson);
            
            // Step 2: Deserialize JSON
            Map<String, Object> salesEntry = (Map<String, Object>) JSON.deserializeUntyped(salesEntryJson);
            Map<String, Object> amountEntry = (Map<String, Object>) JSON.deserializeUntyped(amountEntryJson);
            
            List<Object> rawList = (List<Object>) JSON.deserializeUntyped(salesEntryListJson);
            List<Map<String, Object>> salesEntryList = new List<Map<String, Object>>();
            Set<Id> journalIds = new Set<Id>(); // 🆕 Collect IDs for update
            for (Object obj : rawList) {
                Map<String, Object> entryMap = (Map<String, Object>) obj;
                salesEntryList.add(entryMap);
    
                if (entryMap.containsKey('Id') && entryMap.get('Id') != null) {
                    String journalId = String.valueOf(entryMap.get('Id'));
                    if (!String.isBlank(journalId) && (journalId.length() == 15 || journalId.length() == 18)) {
                        journalIds.add(journalId);
                    }
                }
            }
            Map<Id, Accounting_Journal_Entry__c> existingJournalEntryMap = new Map<Id, Accounting_Journal_Entry__c>();
            if (!journalIds.isEmpty()) {
                existingJournalEntryMap = new Map<Id, Accounting_Journal_Entry__c>(
                    [SELECT Id, Sl_no__c FROM Accounting_Journal_Entry__c WHERE Id IN :journalIds]
                );
            }
            System.debug('✅ Deserialized salesEntry: ' + salesEntry);
            System.debug('✅ Deserialized amountEntry: ' + amountEntry);
            System.debug('✅ Deserialized salesEntryList: ' + salesEntryList);
            
            // Step 3: Build Invoice Record
            String invoiceId = String.valueOf(salesEntry.get('invoiceId'));
            Boolean isValidId = !String.isBlank(invoiceId) && (invoiceId.length() == 15 || invoiceId.length() == 18);
            System.debug('isValidId ' + isValidId);
          
            Decimal subTotal = Decimal.valueOf(String.valueOf(amountEntry.get('subTotal')));
            Decimal taxAmount = Decimal.valueOf(String.valueOf(amountEntry.get('taxAmount')));
            Decimal totalAmount = Decimal.valueOf(String.valueOf(amountEntry.get('totalAmount')));
             System.debug('✅ subTotal: ' + subTotal);
            System.debug('✅ taxAmount ' + taxAmount);
              System.debug('✅ totalAmount ' + totalAmount);
            
            
            System.debug('✅ InvoiceDate ' + Date.valueOf((String)salesEntry.get('InvoiceDate')));
            System.debug('✅ InvoiceNo ' + (String)salesEntry.get('InvoiceNo'));
            System.debug('✅ Status ' + (String)salesEntry.get('Status'));
            System.debug('✅ company ' + (String)salesEntry.get('company'));
            
            invoiceRecord = new Accounting_Invoices_Expenses__c(
                //Include_GST__c     = (String)salesEntry.get('IncludeGST'),
                Invoice_Date__c    = Date.valueOf((String)salesEntry.get('InvoiceDate')),
         
                Invoice_No__c      = (String)salesEntry.get('InvoiceNo'),
                Status__c          = (String)salesEntry.get('Status'),
                Company__c         = (String)salesEntry.get('company'),
                Entity_Type__c     = 'Invoice',
                GST__c             = taxAmount,
                Total_Amount__c    = totalAmount,
                Sub_Total__c       = subTotal
            );
            if(isParticipantInvoice ==true){
               invoiceRecord.Participant__c=(String)salesEntry.get('participantID');
               invoiceRecord.Is_Service_Invoice__c=true;
               invoiceRecord.Services_Id_List__c=(String)salesEntry.get('ServicesList');
            }else{ 
                  invoiceRecord.Post_Date__c= Date.valueOf((String)salesEntry.get('PostDate'));
                  invoiceRecord.Due_Date__c = Date.valueOf((String)salesEntry.get('dueDate'));
            }
            if (isRFQ == true) {
            	invoiceRecord.Is_RFQ__c = true;
            } else if (isRFQ == false && isParticipantInvoice ==false){
                invoiceRecord.Is_Payroll_Sales__c = true;
            }
                System.debug('isValidId ==>' + isValidId);
            if (isValidId) {
                invoiceRecord.Id = invoiceId;
                update invoiceRecord;
                System.debug('✅ Invoice Updated: ' + invoiceRecord.Id);
            } else {
                insert invoiceRecord;
                System.debug('✅ Invoice Inserted: ' + invoiceRecord.Id);
            }
            
            // Step 4: Process Journal Entries
            for (Map<String, Object> entry : salesEntryList) {
                System.debug('➡ Processing entry: ' + entry);
                //  System.debug('➡ Processing entry: ' +(String)salesEntry.get('lineItems'));
                String taxStr = String.valueOf(entry.get('tax')).replace('%', '');
                Decimal taxValue = Decimal.valueOf(taxStr);
                Decimal taxMultiplier = 1 + (taxValue / 100);
                 
                Decimal unitPrice = Decimal.valueOf(String.valueOf(entry.get('Amount__c')));
                System.debug('➡ Processing unitPrice: ' + unitPrice);
                Decimal quantity = Decimal.valueOf(String.valueOf(entry.get('Quantity__c')));
                System.debug('➡ Processing quantity: ' + quantity);
                Boolean taxInclusive = Boolean.valueOf(String.valueOf(salesEntry.get('taxInclusive')));
    			System.debug('➡ Tax Inclusive? ' + taxInclusive);
                Decimal baseTotal = (unitPrice * quantity).setScale(2);
               // Decimal totalWithTax = subTotalJE / taxMultiplier;
               // Decimal taxAmountJE = (subTotalJE - totalWithTax).setScale(2);
                
                 
                Decimal subTotalJE;
    			Decimal taxAmountJE;
    			Decimal totalWithTax;
                if (taxInclusive) {
                    // Tax is included in the amount
                    subTotalJE = (baseTotal / taxMultiplier).setScale(2);
                    taxAmountJE = (baseTotal - subTotalJE).setScale(2);
                    totalWithTax = baseTotal;
                } else {
                    // Tax is added on top
                    subTotalJE = baseTotal;
                    taxAmountJE = (baseTotal * taxValue / 100).setScale(2);
                    totalWithTax = (subTotalJE + taxAmountJE).setScale(2);
                }
                System.debug('✅ Sub Total: ' + subTotalJE);
                System.debug('✅ Tax Amount: ' + taxAmountJE);
                System.debug('✅ Total Amount: ' + totalWithTax);
                
                Accounting_Journal_Entry__c journalRecord = new Accounting_Journal_Entry__c();
                
                
                // Now assign the fields separately
                journalRecord.Tax_Amount__c = taxAmountJE;
                journalRecord.Total_Amount__c = subTotalJE;
                journalRecord.Sub_Total__c = totalWithTax;
                //journalRecord.Amount__c = totalWithTax;
                journalRecord.Description__c = String.valueOf(entry.get('Description__c'));
                journalRecord.Company__c = (String)salesEntry.get('company');
                journalRecord.Tax_Inclusive__c = (Boolean)salesEntry.get('taxInclusive');
                journalRecord.Entry_Type__c = 'Sales';
              
                journalRecord.Sl_no__c = Decimal.valueOf(String.valueOf(entry.get('sno')));
                journalRecord.Invoice_Date__c = Date.valueOf((String)salesEntry.get('InvoiceDate'));
                 System.debug('isParticipantInvoice : ' + isParticipantInvoice);
                if(isParticipantInvoice ==false){
                    journalRecord.Post_Date__c = Date.valueOf((String)salesEntry.get('PostDate'));
                    //journalRecord.Entity_Profile__c = (String)salesEntry.get('entityName');
                      
                    String entityId = (String)salesEntry.get('entityName');
                    journalRecord.Entity_Profile__c = entityId;
                        
                    if (entityId != null) {
                        Entity_Profile__c entity = [
                            SELECT Name__c, First_Name__c, Last_Name__c 
                            FROM Entity_Profile__c 
                            WHERE Id = :entityId 
                            LIMIT 1
                        ];
                        
                        if (entity.Name__c != null && entity.Name__c.trim() != '') {
                            journalRecord.Entity_Profile_Name__c = entity.Name__c;
                        } else {
                            String fullName = ((entity.First_Name__c != null) ? entity.First_Name__c : '') + 
                                ' ' + 
                                ((entity.Last_Name__c != null) ? entity.Last_Name__c : '');
                            journalRecord.Entity_Profile_Name__c = fullName.trim();
                        }
                    }
                                    
                    journalRecord.Invoice_No__c = (String)salesEntry.get('InvoiceNo'); // Uncomment if needed
                    journalRecord.Comments__c = (String)salesEntry.get('comments');
                    journalRecord.Notes__c = (String)salesEntry.get('notes');
                }else{
                    journalRecord.Line_Items__c=String.valueOf(entry.get('lineItems'));
                }
               
                journalRecord.Unit_Price__c = unitPrice;
                journalRecord.Quantity__c = quantity;
                journalRecord.Tax__c = taxValue;
                journalRecord.Accounting_Ledger_Items__c = String.valueOf(entry.get('accountItemId'));
                journalRecord.Accounting_Invoices_Expenses__c = invoiceRecord.Id;
                
                String journalId = String.valueOf(entry.get('Id'));
                Boolean validJournalId = !String.isBlank(journalId) && (journalId.length() == 15 || journalId.length() == 18);
                 if (isRFQ == true) {
                    journalRecord.Is_RFQ__c = true;
                    journalRecord.Tax_Inclusive__c = (Boolean)salesEntry.get('taxInclusive');  
                }
                if (validJournalId) {
                    journalRecord.Id = journalId;
                    
                    Accounting_Journal_Entry__c existing = existingJournalEntryMap.get(journalId);
                    if (existing != null && existing.Sl_no__c != null && existing.Sl_no__c != journalRecord.Sl_no__c) {
                        journalRecord.Is_Sno_Changed__c = true; 
                        System.debug('⚠️ SNO changed for: ' + journalId + ' (Old: ' + existing.Sl_no__c + ', New: ' + journalRecord.Sl_no__c + ')'); 
                    }
                    journalEntriesToUpdate.add(journalRecord);
                } else {
                    journalEntriesToInsert.add(journalRecord);
                }
            }
            
            // Step 5: Perform Bulk DML
            if (!journalEntriesToInsert.isEmpty()) {
                insert journalEntriesToInsert;
                System.debug('✅ Inserted ' + journalEntriesToInsert.size() + ' Journal Entries');
            }
            
            if (!journalEntriesToUpdate.isEmpty()) {
                update journalEntriesToUpdate;
                System.debug('✅ Updated ' + journalEntriesToUpdate.size() + ' Journal Entries');
            }
            
        } catch (Exception e) {
            System.debug('❌ Exception occurred: ' + e.getMessage());
            throw new AuraHandledException(e.getMessage());
        }
        
        System.debug('🔚 Returning Invoice Record: ' + invoiceRecord);
        return invoiceRecord;
    }
   
    
    /*@AuraEnabled
    public static void deleteMatchingRecords(String deletedIdsJson) {
        System.debug('  deletedIdsJson: ' + deletedIdsJson);
        try {
            
            List<String> idsToDelete = (List<String>) JSON.deserialize(deletedIdsJson, List<String>.class);
            if (idsToDelete.isEmpty()) return;
            
            // Lock the reference record
            Accounting_Journal_Entry__c ref = [
                SELECT Accounting_Invoices_Expenses__c, Sl_no__c 
                FROM Accounting_Journal_Entry__c 
                WHERE Id = :idsToDelete[0] 
                LIMIT 1 
                FOR UPDATE
            ];
            
            List<Accounting_Journal_Entry__c> toDelete = [
                SELECT Id 
                FROM Accounting_Journal_Entry__c 
                WHERE Accounting_Invoices_Expenses__c = :ref.Accounting_Invoices_Expenses__c
                AND Sl_no__c = :ref.Sl_no__c
            ];
            
            System.debug('Matching records to delete: ' + toDelete.size());
            
            // Use allOrNone=false to handle partial deletes gracefully
            Database.delete(toDelete, false);
            
        } catch (Exception ex) {
            System.debug('Error in deleteMatchingRecords: ' + ex.getMessage());
            throw new AuraHandledException('Error deleting matching records: ' + ex.getMessage());
        }
    }   */
  /*  @AuraEnabled
    public static void deleteMatchingRecords(String deletedIdsJson) {
        try {
            // Step 1: Log the input
            System.debug('🧾 Incoming deletedIdsJson: ' + deletedIdsJson);
    
            // Step 2: Deserialize JSON to List<String>
            List<String> idsToDelete = (List<String>) JSON.deserialize(deletedIdsJson, List<String>.class);
            if (idsToDelete.isEmpty()) return;
    
            // Step 3: Fetch reference records (child records from the input list)
            List<Accounting_Journal_Entry__c> referenceRecords = [
                SELECT Id, Accounting_Invoices_Expenses__c, Sl_no__c
                FROM Accounting_Journal_Entry__c
                WHERE Id IN :idsToDelete
            ];
    
            // Step 4: Build a set of unique keys (InvoiceId-Sl_no)
            Set<String> uniqueKeys = new Set<String>();
            for (Accounting_Journal_Entry__c rec : referenceRecords) {
                if (rec.Accounting_Invoices_Expenses__c != null && rec.Sl_no__c != null) {
                    String key = rec.Accounting_Invoices_Expenses__c + '-' + rec.Sl_no__c;
                    uniqueKeys.add(key);
                }
            }
    
            System.debug('🔑 Unique (Invoice, Sl_no) keys: ' + uniqueKeys);
    
            // Step 5: Fetch all journal entries that could match
            List<Accounting_Journal_Entry__c> allEntries = [
                SELECT Id, Accounting_Invoices_Expenses__c, Sl_no__c
                FROM Accounting_Journal_Entry__c
                WHERE Accounting_Invoices_Expenses__c != null AND Sl_no__c != null
            ];
    
            // Step 6: Match each record and collect for deletion
            List<Accounting_Journal_Entry__c> recordsToDelete = new List<Accounting_Journal_Entry__c>();
            for (Accounting_Journal_Entry__c entry : allEntries) {
                String entryKey = entry.Accounting_Invoices_Expenses__c + '-' + entry.Sl_no__c;
                if (uniqueKeys.contains(entryKey)) {
                    recordsToDelete.add(entry);
                }
            }
    
            System.debug('🗑️ Total records to delete: ' + recordsToDelete.size());
    
            // Step 7: Delete matched records (partial delete allowed)
            Database.delete(recordsToDelete, false);
    
        } catch (Exception ex) {
            System.debug('❌ Error in deleteMatchingRecords: ' + ex.getMessage());
            throw new AuraHandledException('Error deleting matching records: ' + ex.getMessage());
        }
    }*/
 	/*@AuraEnabled
public static void deleteMatchingRecords(String deletedIdsJson) {
    System.debug('🔁 Input JSON: ' + deletedIdsJson);
    
    try {
        List<String> idsToDelete = (List<String>) JSON.deserialize(deletedIdsJson, List<String>.class);
        System.debug('🔍 Deserialized IDs: ' + idsToDelete);
        
        if (idsToDelete.isEmpty()) {
            System.debug('⚠️ No IDs provided. Exiting method.');
            return;
        }

        // Step 1: Fetch all reference records
        List<Accounting_Journal_Entry__c> referenceEntries = [
            SELECT Id, Accounting_Invoices_Expenses__c, Sl_no__c
            FROM Accounting_Journal_Entry__c
            WHERE Id IN :idsToDelete
            FOR UPDATE
        ];
        System.debug('📌 Reference entries fetched: ' + referenceEntries.size());

        // Step 2: Build a list of all matching records
        List<Accounting_Journal_Entry__c> allToDelete = new List<Accounting_Journal_Entry__c>();

        for (Accounting_Journal_Entry__c entry : referenceEntries) {
              System.debug('🔄 Processing Entry Id: ' + entry.Id);
            if (entry.Accounting_Invoices_Expenses__c != null && entry.Sl_no__c != null) {
                 System.debug('🧾 Invoice Id: ' + entry.Accounting_Invoices_Expenses__c + 
                             ' | Sl_no: ' + entry.Sl_no__c);
                List<Accounting_Journal_Entry__c> matches = [
                    SELECT Id
                    FROM Accounting_Journal_Entry__c
                    WHERE Accounting_Invoices_Expenses__c = :entry.Accounting_Invoices_Expenses__c
                    AND Sl_no__c = :entry.Sl_no__c
                ];
                System.debug('🔍 Found ' + matches.size() + ' matching records for Invoice: ' +
                             entry.Accounting_Invoices_Expenses__c + ', Sl_no: ' + entry.Sl_no__c);
                for (Accounting_Journal_Entry__c match : matches) {
                    System.debug('✅ Matched Record to Delete: ' + match.Id);
                }
                allToDelete.addAll(matches);
            } else {
                System.debug('❌ Skipping entry due to missing Invoice or Sl_no__c: ' + entry.Id);
            }
        }

        System.debug('🗑️ Total records to delete: ' + allToDelete.size());

        // Step 3: Delete
        Database.delete(allToDelete, false);
        System.debug('✅ Delete operation completed');

    } catch (Exception ex) {
        System.debug('❗ Error in deleteMatchingRecords: ' + ex.getMessage());
        throw new AuraHandledException('Error deleting matching records: ' + ex.getMessage());
    }
}*/
   @AuraEnabled
public static void deleteMatchingRecords(String deletedIdsJson) {
    System.debug('🔁 Input JSON: ' + deletedIdsJson);
    
    try {
        List<String> idsToDelete = (List<String>) JSON.deserialize(deletedIdsJson, List<String>.class);
        System.debug('🔍 Deserialized IDs: ' + idsToDelete);
        
        if (idsToDelete.isEmpty()) {
            System.debug('⚠️ No IDs provided. Exiting method.');
            return;
        }

        // Step 1: Fetch reference entries
        List<Accounting_Journal_Entry__c> referenceEntries = [
            SELECT Id, Accounting_Invoices_Expenses__c, Sl_no__c
            FROM Accounting_Journal_Entry__c
            WHERE Id IN :idsToDelete
            FOR UPDATE
        ];
        System.debug('📌 Reference entries fetched: ' + referenceEntries.size());

        // Step 2: Collect unique (Invoice, Sl_no) combinations
        Set<Id> invoiceIds = new Set<Id>();
        Set<Decimal> slNos = new Set<Decimal>();
        Set<String> uniqueKeys = new Set<String>();

        for (Accounting_Journal_Entry__c entry : referenceEntries) {
            if (entry.Accounting_Invoices_Expenses__c != null && entry.Sl_no__c != null) {
                String key = entry.Accounting_Invoices_Expenses__c + ':' + entry.Sl_no__c;
                if (!uniqueKeys.contains(key)) {
                    uniqueKeys.add(key);
                    invoiceIds.add(entry.Accounting_Invoices_Expenses__c);
                    slNos.add(entry.Sl_no__c);
                    System.debug('🔄 Added Unique Key: ' + key);
                }
            } else {
                System.debug('❌ Missing Invoice or Sl_no for entry Id: ' + entry.Id);
            }
        }

        // Step 3: Query all potential matching records once
        List<Accounting_Journal_Entry__c> allMatches = new List<Accounting_Journal_Entry__c>();
        if (!invoiceIds.isEmpty() && !slNos.isEmpty()) {
            allMatches = [
                SELECT Id, Accounting_Invoices_Expenses__c, Sl_no__c
                FROM Accounting_Journal_Entry__c
                WHERE Accounting_Invoices_Expenses__c IN :invoiceIds
                AND Sl_no__c IN :slNos
            ];
        }

        // Step 4: Filter only those that match the exact keys
        List<Accounting_Journal_Entry__c> allToDelete = new List<Accounting_Journal_Entry__c>();
        for (Accounting_Journal_Entry__c rec : allMatches) {
            String key = rec.Accounting_Invoices_Expenses__c + ':' + rec.Sl_no__c;
            if (uniqueKeys.contains(key)) {
                allToDelete.add(rec);
                System.debug('✅ To Delete: ' + rec.Id + ' (Key: ' + key + ')');
            }
        }

        System.debug('🧮 Total unique match groups: ' + uniqueKeys.size());
        System.debug('🗑️ Final total records to delete: ' + allToDelete.size());

        // Step 5: Delete
        if (!allToDelete.isEmpty()) {
            Database.delete(allToDelete, false);
            System.debug('✅ Delete operation completed');
        } else {
            System.debug('ℹ️ No records to delete.');
        }

    } catch (Exception ex) {
        System.debug('❗ Error in deleteMatchingRecords: ' + ex.getMessage());
        throw new AuraHandledException('Error deleting matching records: ' + ex.getMessage());
    }
}

}