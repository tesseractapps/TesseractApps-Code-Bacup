@IsTest
public class CorrectiveActionOverdueSchedulerTest {

    @IsTest
    static void testSchedulerExecute() {

        Test.startTest();

        CorrectiveActionOverdueScheduler scheduler =
            new CorrectiveActionOverdueScheduler();

        scheduler.execute(null);

        Test.stopTest();
 
    }
}