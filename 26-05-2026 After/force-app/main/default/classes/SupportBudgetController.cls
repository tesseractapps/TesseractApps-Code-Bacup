public class SupportBudgetController {
    
    @AuraEnabled
    public static Id createSupportBudget(

        Id participantId,
        String serviceType,
        String serviceItem,
        Decimal unitPrice,
        Decimal totalHours,
        Decimal totalAmount,
        Decimal actualAmount,
        String startTime,
        String endTime,
        Date budgetDate
    ){
        try{

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
            budget.Budget_Date__c = budgetDate;

            insert budget;

            return budget.Id;

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
                Amazon_file_URL__c
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
        Date budgetDate,
        String amazonFileUrl
    ){
        try{

            Support_Budget__c budget = [

                SELECT Id
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
            budget.Budget_Date__c = budgetDate;
            budget.Amazon_file_URL__c = amazonFileUrl;

            update budget;

        } catch(Exception e){

            throw new AuraHandledException(
                e.getMessage()
            );
        }
    }

}