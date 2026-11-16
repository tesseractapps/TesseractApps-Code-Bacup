/**
 * @description       : 
 * @author            : Raja Sekhar Reddy
 * @group             : 
 * @Test Class		  : PayRollExpenseHandlerTest
 * @last modified on  : 06-19-2023
 * @last modified by  : Raja Sekhar Reddy
**/
public with sharing class PayRollExpenseHandler {
    
    @AuraEnabled
    public static List<Expenses__c> getExpensesData(String staffId,Date startDate, Date endDate ){ 
        System.debug('staffId==>'+staffId);
          System.debug('startDate-->'+startDate);
          System.debug('endDate-->'+endDate);
//start
        if(staffId!=null && startDate == null && endDate == null){
            return [SELECT id,name,Type_of_Expense__c,Sub_type__c,Comments__c,Facility__c,Date__c,Amount__c,Staff__c,GST__c,Status__c,User_Name__c,Amazon_URL__c,Incl_GST__c,Description__c	
                FROM Expenses__c   WHERE Facility__c=:staffId Order by createddate desc];
        } else{
            //end
        return [SELECT id,name,Type_of_Expense__c,Sub_type__c,Comments__c,Facility__c,Date__c,Amount__c,Staff__c,GST__c,Status__c,User_Name__c,Amazon_URL__c,Incl_GST__c,Description__c	
                FROM Expenses__c WHERE Facility__c=:staffId AND Date__c >=:startDate AND Date__c <=:endDate Order by createddate desc] ;
        }
    }    

    @AuraEnabled
    public static string createExpensesAds(String typeofExpense,String subType,String dateValue,String comments,String amount,String selectedValue,String gst){
        List<Expenses__c> expensesList=new List<Expenses__c>();
        try {
            Expenses__c expRed=new Expenses__c();
            expRed.Type_of_Expense__c=typeofExpense;
            expRed.Sub_type__c=subType;
            expRed.Comments__c=comments;
            expRed.Date__c=Date.valueOf(dateValue);
            //expRed.Start_Date__c = Date.valueOf(startDateValue);
            //expRed.End_Date__c = Date.valueOf(endDateValue);
            expRed.Amount__c=Decimal.valueOf(amount);
            expRed.Facility__c=selectedValue;
            expRed.GST__c = gst;
            expensesList.add(expRed);
            if(expensesList.size()!=0){
                insert expensesList;
            }
               
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
        system.debug(expensesList[0].id);
        return expensesList[0].id;
    }

    @AuraEnabled
    public static void deleteRepository(string repData){
        try {
            //delete repData;
            List<Expenses__c> repList = [SELECT id,Name,Type_of_Expense__c,Sub_type__c,Comments__c,Facility__c,Date__c,Amount__c,Staff__c,GST__c,Status__c from Expenses__c where id = :repData];
            delete repList;
        }
        catch(Exception ex) {
            throw new AuraHandledException(ex.getMessage());
        }
    } 
    
    @AuraEnabled  
    public static string UpdateFileSize(string recordId, string filesize) { 
        Attachment__c pat= new Attachment__c(id=recordId);
        pat.Size__c=filesize;
        update pat;
        return 'Updated';  
    }
    
    @AuraEnabled
    public static List<Expenses__c> saveFile(String selectedValue, String base64Data) {
        String UserEmail = UserInfo.getUserEmail(); 
        Id facilityId;
        List<Staff__c> staffData=[SELECT id,Name,role__c,Facility__c FROM Staff__c 
                                WHERE Email_Address__c =:UserEmail LIMIT 1];
        if(staffData.Size()>0){
            facilityId = staffData[0].Facility__c;
        } else {
            //User u = [SELECT ID,Name,Facility_Name__c from User where Email =:UserEmail LIMIT 1];
           // system.debug('user'+u.Facility_Name__c);
            //Facility__c fac = [SELECT Id,Name from Facility__c WHERE Name =:u.Facility_Name__c LIMIT 1];
            facilityId = selectedValue;
        }
        String data = JSON.deserializeUntyped(base64Data).toString();
        List<Expenses__c> lstCCToInsert = new List<Expenses__c>();
        List<String> lstCSVLines = data.split('\n');
        String facName='';
        for (Integer i = 1; i < lstCSVLines.size(); i++) {
            Expenses__c exp = new Expenses__c();
            String csvLine = lstCSVLines[i];
            List<String> csvRowData = new List<String>();           
            
            for (String column : csvLine.split(',')) {
                column = column.replaceAll(':quotes:', '"').replaceAll(':comma:', ',');
                csvRowData.add(column);
            }
            
            System.debug('CSV Row >> ' + csvRowData);
            
            if (csvRowData.size() > 1) {
                exp.Date__c = Date.valueOf(csvRowData[0]);
                exp.Description__c = csvRowData[1];
                System.debug('Amount >> ' + csvRowData[2]);
                exp.Facility__c = facilityId;
                // Handling the Decimal conversion
                try {
                    String cleanedAmount = csvRowData[2].replaceAll('[^0-9.]', '');
                    exp.Amount__c = Decimal.valueOf(cleanedAmount);
                } catch (Exception e) {
                    System.debug('Error converting to decimal: ' + e.getMessage());
                    // Handle the exception as needed, set a default value, or log an error
                    exp.Amount__c = 0; // Set a default value or handle the error case accordingly
                }
                
                lstCCToInsert.add(exp);
            } else {
                System.debug('Skipping invalid CSV row: ' + csvRowData);
                // Log or handle the case where the CSV row is incomplete or invalid
            }
        }
        
        if (!lstCCToInsert.isEmpty()) {
            insert lstCCToInsert;
        }
        
        return lstCCToInsert;
    }
    @AuraEnabled
    @future
    public static void insertExpenses(string expenseJson) {
        String UserEmail = UserInfo.getUserEmail(); 
        Id userId =UserInfo.getUserId();
        Id facilityId;
        List<Staff__c> staffData=[SELECT id,Name,role__c,Facility__c FROM Staff__c 
                                  WHERE Email_Address__c =:UserEmail LIMIT 1];
        facilityId = staffData[0].Facility__c;
        List<expenseWrapper> expenseWrapperList = (List<expenseWrapper>)System.JSON.deserialize(expenseJson,List<expenseWrapper>.class);
        system.debug('expense list '+expenseWrapperList);
        List<Expenses__c> expensesList=new List<Expenses__c>();
        try {
            for(expenseWrapper exp:expenseWrapperList){
                Expenses__c expRed=new Expenses__c();
                expRed.Date__c=Date.valueOf(exp.dateofIssue);
                expRed.Facility__c=facilityId;
                if(boolean.valueOf(exp.IncludeGST)==true){
                   expRed.GST__c = 'Yes';  
                }else{
                    expRed.GST__c = 'No'; 
                }
                expRed.Amount__c=Decimal.valueOf(exp.Amount);
                expRed.Type_of_Expense__c='Other';
                expRed.User__c=userId;
                expRed.Description__c=exp.Description;
                expensesList.add(expRed); 
            }
            
            if(expensesList.size()!=0){
                insert expensesList;
            }
            
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
        
    }
    
    
    @AuraEnabled
    @future
    public static void insertInvoices(string expenseJson) {
            String UserEmail = UserInfo.getUserEmail(); 
            Id userId =UserInfo.getUserId();
            string orgID;
            List<Staff__c> staffData=[SELECT id,Name,role__c,Facility__r.Organisation__c FROM Staff__c 
            WHERE Email_Address__c =:UserEmail LIMIT 1];
            orgID = staffData[0].Facility__r.Organisation__c ;
            List<expenseWrapper> expenseWrapperList = (List<expenseWrapper>)System.JSON.deserialize(expenseJson,List<expenseWrapper>.class);
            system.debug('expense list '+expenseWrapperList);
            List<Invoice_Parent__c> InvoiceParentList=new List<Invoice_Parent__c>();
            List<Invoice__c> invList=new List<Invoice__c>();
            try {
                for(expenseWrapper exp:expenseWrapperList){
                    Invoice_Parent__c invParent = new Invoice_Parent__c();
                    invParent.Organization__c=orgId;
                    invParent.Date_Issued__c=Date.valueOf(exp.dateofIssue);
                    invParent.CSV_Descriprion__c=exp.Description;
                    invParent.Total_CSV_Amount__c=Decimal.valueOf(exp.Amount);
                    invParent.Is_Created_From_CSV__c=true;
                    if(boolean.valueOf(exp.IncludeGST)==true){
                    	invParent.Include_GST__c = 'Yes';  
                       }else{
                        invParent.Include_GST__c = 'No'; 
                        }
                    InvoiceParentList.add(invParent); 
                }
            
            if(InvoiceParentList.size()!=0){
            	insert InvoiceParentList;
            }
            
            for(Invoice_Parent__c inv:InvoiceParentList){
                Invoice__c invRec= new Invoice__c();
                system.debug('invoice description '+inv.CSV_Descriprion__c);
                invRec.Description__c=inv.CSV_Descriprion__c;
                invRec.Invoice_Parent__c=inv.Id;
                  system.debug('invoice description '+inv.CSV_Descriprion__c);
                invRec.Include_GST__c = inv.Include_GST__c;
                invRec.CSV_Amount__c=inv.Total_CSV_Amount__c;
                invList.add(invRec);
                }
                if(invList.size()>0){
                    insert invList;
            	}
            
            } catch (Exception e) {
            	throw new AuraHandledException(e.getMessage());
            }
            
        }
    
     
    
     public class expenseWrapper{
        public String DateOfIssue;
        public String Amount;
        public String Description;  
        public string IncludeGST;
    }
    
    @AuraEnabled
    public static void saveSearchKey(String searchKey) {
        try{
            String UserEmail = UserInfo.getUserEmail(); 
            Id userId =UserInfo.getUserId();
            string facID;
            List<Staff__c> staffData=[SELECT id,Name,role__c,Facility__c FROM Staff__c 
                                      WHERE Email_Address__c =:UserEmail LIMIT 1];
            facID = staffData[0].Facility__c ;
            List<Facility__c> facRecords = [SELECT Id, Key_Words__c FROM Facility__c where id=:facID LIMIT 1];
            if (!facRecords.isEmpty()) {
                Facility__c fac = facRecords[0];
                 if (String.isBlank(fac.Key_Words__c)) {
                    fac.Key_Words__c = searchKey;
                } else {
                    fac.Key_Words__c += ' ' + searchKey;
                }
                update fac;
            } 
        }catch (Exception e){
            throw new AuraHandledException(e.getMessage());
        } 
    }
    
    @AuraEnabled(cacheable=true)
    public static String getSearchKeys() {
        String userEmail = UserInfo.getUserEmail(); 
        List<Staff__c> staffData = [SELECT id,Facility__c,Facility__r.Key_Words__c FROM Staff__c WHERE Email_Address__c = :userEmail LIMIT 1];
        if (!staffData.isEmpty()) {
                return staffData[0].Facility__r.Key_Words__c;

        }
        return null;
    }
    
     @AuraEnabled
    public static List<Expense__mdt> getExpenses(String typeofExpense) {
        return [SELECT DeveloperName,Type_of_Expense__c,Sub_Type__c,Tax_Code__c,Code__c,Description__c,Enable_Payments__c,Expense_Claims__c FROM Expense__mdt where
                Type_of_Expense__c=:typeofExpense];
    }
}