public class SupportBudgetController {
    
    @AuraEnabled
    public static List<Id> createSupportBudget(

        Id participantId,
        String serviceType,
        String serviceItem,
        Decimal unitPrice,
        Decimal totalHours,
        Decimal totalAmount,
        Decimal actualAmount,
        String startTime,
        String endTime,
       // Date budgetDate,
        List<String> recurrenceDates,
        String invoiceNo
    ){
        try{
            List<Support_Budget__c> budgets =new List<Support_Budget__c>();

            for(String dateStr : recurrenceDates){
                Support_Budget__c budget = new Support_Budget__c();
                budget.Support_Client__c = participantId;
                budget.Service_Type__c = serviceType;
                budget.Service_Item__c = serviceItem;
                budget.Unit_Price__c = unitPrice;
                budget.Total_Hours__c = totalHours;
                budget.Total_Amount__c = totalAmount;
                budget.Actual_Amount__c = actualAmount;
                budget.Start_Time__c = parseTime(startTime);
                budget.End_Time__c = parseTime(endTime);
                //budget.Budget_Date__c = budgetDate;
                budget.Budget_Date__c = Date.valueOf(dateStr);
                budget.Invoice_No__c = invoiceNo;

                budgets.add(budget);
            }
            insert budgets;
            List<Id> budgetIds = new List<Id>();
            //return budget.Id;
            for(Support_Budget__c sb : budgets){
                budgetIds.add(sb.Id);
            }

            return budgetIds;

        } catch(Exception e){

            throw new AuraHandledException(e.getMessage());
        }
    }
        
    private static Time parseTime(String timeString){

        List<String> parts = timeString.split(' ');

        String timePart = parts[0];
        String amPm = parts[1];

        List<String> timeValues = timePart.split(':');

        Integer hour = Integer.valueOf(timeValues[0]);
        Integer minute = Integer.valueOf(timeValues[1]);

        if(amPm == 'PM' && hour != 12){
            hour += 12;
        }

        if(amPm == 'AM' && hour == 12){
            hour = 0;
        }

        return Time.newInstance(hour, minute, 0, 0);
    }

    @AuraEnabled
    public static List<Support_Budget__c> getSupportBudgets(Id participantId){

        return [
            SELECT
                Id,
                Name,
                Budget_Date__c,
                Service_Type__c,
                Service_Item__c,
                Start_Time__c,
                End_Time__c,
                Total_Hours__c,
                Total_Amount__c,
                Actual_Amount__c,
                Unit_Price__c,
                Amazon_file_URL__c,
                Invoice_No__c
            FROM Support_Budget__c
            WHERE Support_Client__c = :participantId
            ORDER BY Budget_Date__c DESC
        ];
    }

    @AuraEnabled
    public static void deleteSupportBudget(Id budgetId){

        delete [
            SELECT Id
            FROM Support_Budget__c
            WHERE Id = :budgetId
            LIMIT 1
        ];
    }

    @AuraEnabled
    public static void updateSupportBudget(

        Id budgetId,
        String serviceType,
        String serviceItem,
        Decimal unitPrice,
        Decimal totalHours,
        Decimal totalAmount,
        Decimal actualAmount,
        String startTime,
        String endTime,
        //Date budgetDate,
        List<String> recurrenceDates,
        String amazonFileUrl,
        String invoiceNo
    ){
        try{

            Support_Budget__c budget = [

                SELECT Id,Support_Client__c
                FROM Support_Budget__c
                WHERE Id = :budgetId
                LIMIT 1
            ];

            budget.Service_Type__c = serviceType;
            budget.Service_Item__c = serviceItem;
            budget.Unit_Price__c = unitPrice;
            budget.Total_Hours__c = totalHours;
            budget.Total_Amount__c = totalAmount;
            budget.Actual_Amount__c = actualAmount;
            budget.Start_Time__c = parseTime(startTime);
            budget.End_Time__c = parseTime(endTime);
            //budget.Budget_Date__c = budgetDate;
            budget.Amazon_file_URL__c = amazonFileUrl;
            budget.Invoice_No__c = invoiceNo;
            if(!recurrenceDates.isEmpty()){
                budget.Budget_Date__c =Date.valueOf(recurrenceDates[0]);
            }
            update budget;

            List<Support_Budget__c> budgetsToInsert = new List<Support_Budget__c>();

            for(Integer i = 1; i < recurrenceDates.size(); i++){

                Support_Budget__c newBudget = new Support_Budget__c();

                newBudget.Support_Client__c = budget.Support_Client__c;

                newBudget.Service_Type__c = serviceType;
                newBudget.Service_Item__c = serviceItem;
                newBudget.Unit_Price__c = unitPrice;
                newBudget.Total_Hours__c = totalHours;
                newBudget.Total_Amount__c = totalAmount;
                newBudget.Actual_Amount__c = actualAmount;
                newBudget.Start_Time__c = parseTime(startTime);
                newBudget.End_Time__c = parseTime(endTime);
                newBudget.Budget_Date__c =Date.valueOf(recurrenceDates[i]);
               // newBudget.Amazon_file_URL__c =amazonFileUrl;
                //newBudget.Invoice_No__c =invoiceNo;

                budgetsToInsert.add(newBudget);
            }

            if(!budgetsToInsert.isEmpty()){
                insert budgetsToInsert;
            }

        } catch(Exception e){

            throw new AuraHandledException(
                e.getMessage()
            );
        }
    }
    @AuraEnabled
    public static Map<String,String> validateBudgetDates(
        Id participantId,
        List<String> recurrenceDates,
        Boolean isEditMode,
        Id budgetId
    ){
        Set<Date> budgetDates = new Set<Date>();

        for(String dt : recurrenceDates){
            budgetDates.add(Date.valueOf(dt));
        }

        Map<String,String> conflicts = new Map<String,String>();
        List<Support_Budget__c> existingBudgets;

        if(isEditMode){

            existingBudgets = [
                SELECT Id, Budget_Date__c
                FROM Support_Budget__c
                WHERE Support_Client__c = :participantId
                AND Budget_Date__c IN :budgetDates
                AND Id != :budgetId
            ];

        }else{

            existingBudgets = [
                SELECT Id, Budget_Date__c
                FROM Support_Budget__c
                WHERE Support_Client__c = :participantId
                AND Budget_Date__c IN :budgetDates
            ];
        }

        for(Support_Budget__c budget : existingBudgets){
            conflicts.put(
                String.valueOf(budget.Budget_Date__c),
                'Schedule already exists for this date'
            );
        }

        return conflicts;
    }
    //   @AuraEnabled
    // public static void updateRecord(Id budgetId, String amazonFileUrl) {
    //     try {
    //         Support_Budget__c budget = new Support_Budget__c(
    //             Id = budgetId,
    //             Amazon_file_URL__c = ''
    //         );

    //         update budget;

    //     } catch (Exception e) {
    //         throw new AuraHandledException(e.getMessage());
    //     }
    // }
   
}