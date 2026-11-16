@isTest
public class HolidayListTest {
    public static List<Holiday> createHoliday(){
        List<Holiday> holidayList = new List<Holiday>();
        for(Integer i=0;i<=4;i++){
            Holiday holiday = new Holiday();
            holiday.ActivityDate=System.today().addDays(i);
            holiday.Description='holiday'+i;
            holiday.Name='holidayList'+i;
            holidayList.add(holiday);
        }
        insert holidayList;
        return holidayList;
    }
     static testMethod void allocationTest() {
         List<Holiday> holidayListValues = HolidayListTest.createHoliday();
        HolidayList.holidayList();
     }

}