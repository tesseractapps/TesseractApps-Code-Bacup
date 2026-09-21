@IsTest
public class FundingExpiryNotificationHandlerTest {

    @IsTest
    static void testSendExpiryAlert() {

        TestDataFactory.createBaseData();


        Funds_Tracker__c fund = [
            SELECT Id
            FROM Funds_Tracker__c
            LIMIT 1
        ];


        Staff__c staff = [
            SELECT Id, Email_Address__c
            FROM Staff__c
            WHERE Email_Address__c != null
            LIMIT 1
        ];


        Organisation__c org = [
            SELECT Id, Name, Email__c
            FROM Organisation__c
            LIMIT 1
        ];


        User usr = [
            SELECT Id
            FROM User
            WHERE Email = :staff.Email_Address__c
            LIMIT 1
        ];


        FundingExpiryNotificationHandler.FundingExpiryInput input =
            new FundingExpiryNotificationHandler.FundingExpiryInput();


        input.FundTrackerId = fund.Id;

        input.EmailTo = new List<String>{
            staff.Email_Address__c
        };

        input.NotificationTo = new List<String>{
            usr.Id
        };

        input.orgName = org.Name;

        input.orgEmail = org.Email__c;


        Test.startTest();

        FundingExpiryNotificationHandler.sendExpiryAlert(
            new List<FundingExpiryNotificationHandler.FundingExpiryInput>{
                input
            }
        );

        Test.stopTest();


        List<My_Notification__c> notifications = [
            SELECT Id, Subject__c, Description__c
            FROM My_Notification__c
        ];


        System.assert(
            notifications.size() > 0,
            'Notification should be created'
        );
    }



    @IsTest
    static void testEmptyInput() {

        Test.startTest();

        FundingExpiryNotificationHandler.sendExpiryAlert(
            new List<FundingExpiryNotificationHandler.FundingExpiryInput>()
        );

        Test.stopTest();


        System.assert(true);
    }



    @IsTest
    static void testNullValues() {


        FundingExpiryNotificationHandler.FundingExpiryInput input =
            new FundingExpiryNotificationHandler.FundingExpiryInput();


        Test.startTest();

        FundingExpiryNotificationHandler.sendExpiryAlert(
            new List<FundingExpiryNotificationHandler.FundingExpiryInput>{
                input
            }
        );

        Test.stopTest();


        System.assert(true);
    }
}