public class HolidayList {
    @AuraEnabled
    public static List<Holiday> holidayList(){
        return [SELECT ActivityDate,Description,Id,IsAllDay,IsRecurrence,Name FROM Holiday];
    }

}