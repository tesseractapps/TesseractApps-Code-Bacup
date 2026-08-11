@IsTest
public class NotificationServicesTest {

    @TestSetup
    static void setupData() {
        TestDataFactory.createBaseData();
    }

    @IsTest
    static void testSendNotification() {
        Staff__c staffRec = [SELECT Id, Email_Address__c FROM Staff__c LIMIT 1];
        User usr = [SELECT Id, Email FROM User WHERE Email = :staffRec.Email_Address__c LIMIT 1]; 
       Facility__c fac=[Select Id from Facility__c limit 1];
        
        Test.startTest();
        System.runAs(usr) {
            NotificationServices.sendNotification(
                usr.Id,
                'Test Title',
                'Test Message',
                'Leave Management',
                'Info',
                staffRec.Id,
                fac.Id
            );
        }
        Test.stopTest();
    }

    @IsTest
    static void testSendNotificationWithException() {
        Test.startTest();
          Facility__c fac=[Select Id from Facility__c limit 1];
        NotificationServices.sendNotification(
            null,
            'Test Title',
            'Test Message',
            'Leave Management',
            'Info',
            null,
             fac.Id
        );
        Test.stopTest();
    }

    @IsTest
    static void testGetUserNotifications() {
        Staff__c staffRec = [SELECT Id, Email_Address__c FROM Staff__c LIMIT 1];
        User usr = [SELECT Id, Email FROM User WHERE Email = :staffRec.Email_Address__c LIMIT 1];
        
        Notifications__c testNotif = new Notifications__c(
            Staff__c = staffRec.Id,
            Title__c = 'Test Notification',
            Message__c = 'Test Message',
            Module__c = 'Test Module',
            Type__c = 'Info',
            Is_Read__c = false
        );
        insert testNotif;
        
        System.runAs(usr) {
            Test.startTest();
            NotificationServices.getUserNotifications();
            Test.stopTest();
        }
    }

    @IsTest
    static void testGetUserNotificationsNoStaff() {
        Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
        User testUser = new User(
            Alias = 'nouser',
            Email = 'norelation@test.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'NoStaff',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = prof.Id,
            TimeZoneSidKey = 'America/Los_Angeles',
            UserName = 'nostaff@test.com'
        );
        insert testUser;
        
        System.runAs(testUser) {
            Test.startTest();
            NotificationServices.getUserNotifications();
            Test.stopTest();
        }
    }

    @IsTest
    static void testGetSessionId() {
        Test.startTest();
        NotificationServices.getSessionId();
        Test.stopTest();
    }

    @IsTest
    static void testGetLoggedInStaffId() {
        Staff__c staffRec = [SELECT Id, Email_Address__c FROM Staff__c LIMIT 1];
        User usr = [SELECT Id, Email FROM User WHERE Email = :staffRec.Email_Address__c LIMIT 1];
        
        System.runAs(usr) {
            Test.startTest();
            NotificationServices.getLoggedInStaffId();
            Test.stopTest();
        }
    }

    @IsTest
    static void testGetLoggedInStaffIdNoMatch() {
        Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
        User testUser = new User(
            Alias = 'nomatch',
            Email = 'nomatch@test.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'NoMatch',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = prof.Id,
            TimeZoneSidKey = 'America/Los_Angeles',
            UserName = 'nomatch@test.com'
        );
        insert testUser;
        
        System.runAs(testUser) {
            Test.startTest();
            NotificationServices.getLoggedInStaffId();
            Test.stopTest();
        }
    }

    @IsTest
    static void testSendLeaveStatusNotification() {
        Staff__c staffRec = [SELECT Id FROM Staff__c LIMIT 1];
        
        Leave__c leaveRec = new Leave__c(
            Staff__c = staffRec.Id,
            Status__c = 'Approved',
            From__c = Date.today(),
            To__c = Date.today().addDays(5)
        );
        insert leaveRec;
        
        Test.startTest();
        NotificationServices.sendLeaveStatusNotification(leaveRec.Id);
        Test.stopTest();
    }

    @IsTest
    static void testSendLeaveStatusNotificationRejected() {
        Staff__c staffRec = [SELECT Id FROM Staff__c LIMIT 1];
        
        Leave__c leaveRec = new Leave__c(
            Staff__c = staffRec.Id,
            Status__c = 'Rejected',
            From__c = Date.today(),
            To__c = Date.today().addDays(5)
        );
        insert leaveRec;
        
        Test.startTest();
        NotificationServices.sendLeaveStatusNotification(leaveRec.Id);
        Test.stopTest();
    }

    @IsTest
    static void testSendLeaveStatusNotificationPending() {
        Staff__c staffRec = [SELECT Id FROM Staff__c LIMIT 1];
        
        Leave__c leaveRec = new Leave__c(
            Staff__c = staffRec.Id,
            Status__c = 'Approved',
            From__c = Date.today(),
            To__c = Date.today().addDays(5)
        );
        insert leaveRec;
        
        Test.startTest();
        NotificationServices.sendLeaveStatusNotification(leaveRec.Id);
        Test.stopTest();
    }

    @IsTest
    static void testGetUnreadLeaveRecordIds() {
        Staff__c staffRec = [SELECT Id FROM Staff__c LIMIT 1];
        Leave__c leaveRec = new Leave__c(
    Staff__c = staffRec.Id,
    Status__c = 'Approved',
    From__c = Date.today(),
    To__c = Date.today().addDays(2)
);

insert leaveRec;
        
        Notifications__c ntf = new Notifications__c(
            Staff__c = staffRec.Id,
            Module__c = 'Leave Management',
            Record_Id__c = leaveRec.Id,
            Is_Read__c = false
        );
        insert ntf;
        
        Test.startTest();
        NotificationServices.getUnreadLeaveRecordIds(staffRec.Id);
        Test.stopTest();
    }

    @IsTest
    static void testGetUnreadRejectedShiftIds() {
        Staff__c staffRec = [SELECT Id FROM Staff__c LIMIT 1];
        Add_Shift__c shiftRec = [SELECT Id FROM Add_Shift__c LIMIT 1];
        
        Notifications__c ntf = new Notifications__c(
            Staff__c = staffRec.Id,
            Module__c = 'Rejected Shifts',
            Record_Id__c = shiftRec.Id,
            Is_Read__c = false
        );
        insert ntf;
        
        Test.startTest();
        NotificationServices.getUnreadRejectedShiftIds(staffRec.Id);
        Test.stopTest();
    }

    @IsTest
    static void testGetUnreadReimbursementIds() {
        Staff__c staffRec = [SELECT Id FROM Staff__c LIMIT 1];
        Reimbursement__c rei = [SELECT Id FROM Reimbursement__c LIMIT 1];
        
        Notifications__c ntf = new Notifications__c(
            Staff__c = staffRec.Id,
            Module__c = 'Reimbursement',
            Record_Id__c = rei.Id,
            Is_Read__c = false
        );
        insert ntf;
        
        Test.startTest();
        NotificationServices.getUnreadReimbursementIds(staffRec.Id);
        Test.stopTest();
    }

@IsTest
static void testSendClientFundThresholdNotification() {

    Funds_Tracker__c fundRec = [

        SELECT Id,
               Client__r.Facility__r.Organisation__r.Name

        FROM Funds_Tracker__c

        LIMIT 1
    ];

    String orgName =
        fundRec.Client__r
            .Facility__r
            .Organisation__r.Name;

    // ============================================
    // CREATE USER
    // ============================================

    Profile prof = [
        SELECT Id
        FROM Profile
        LIMIT 1
    ];

    User testUser = new User(

        FirstName = 'NDIS',

        LastName = 'Admin',

        Alias = 'ndadm',

        Email = 'ndisadmin@test.com',

        Username =
            'ndisadmin' +
            System.currentTimeMillis() +
            '@test.com',

        EmailEncodingKey = 'UTF-8',

        LanguageLocaleKey = 'en_US',

        LocaleSidKey = 'en_US',

        TimeZoneSidKey = 'America/Los_Angeles',

        ProfileId = prof.Id,

        User_Type__c = 'NDIS Org Admin',

        Organization_Name__c = orgName
    );

    insert testUser;

    // ============================================
    // CREATE STAFF
    // ============================================

Staff__c staffRec = [

    SELECT Id,
           Email_Address__c

    FROM Staff__c

    WHERE Email_Address__c =
        'manualtesting.20294637@hotmail.com'

    LIMIT 1
];

    Test.startTest();

    NotificationServices.sendClientFundThresholdNotification(
            new List<Id>{ fundRec.Id }
        );

    Test.stopTest();
}

    @IsTest
    static void testSendClientFundThresholdNotificationExhausted() {
        Funds_Tracker__c fundRec = [SELECT Id, Amount_approved__c, Spent_Amt__c, Available_Funds__c 
                                     FROM Funds_Tracker__c LIMIT 1];
        
        fundRec.Amount_approved__c = 10000;
        fundRec.Spent_Amt__c = 10000;
        //fundRec.Available_Funds__c = 0;
        update fundRec;
        
        Test.startTest();
        NotificationServices.sendClientFundThresholdNotification(new List<Id>{ fundRec.Id });
        Test.stopTest();
    }

    @IsTest
    static void testSendClientFundThresholdNotificationEmptyList() {
        Test.startTest();
        NotificationServices.sendClientFundThresholdNotification(new List<Id>());
        Test.stopTest();
    }

    @IsTest
    static void testSendClientFundThresholdNotificationNullList() {
        Test.startTest();
        NotificationServices.sendClientFundThresholdNotification(null);
        Test.stopTest();
    }

    @IsTest
    static void testGetUnreadFundsTrackerIds() {
        Staff__c staffRec = [SELECT Id FROM Staff__c LIMIT 1];
        Funds_Tracker__c fundRec = [SELECT Id FROM Funds_Tracker__c LIMIT 1];
        
        Notifications__c ntf = new Notifications__c(
            Staff__c = staffRec.Id,
            Module__c = 'Funds Tracker',
            Record_Id__c = fundRec.Id,
            Is_Read__c = false
        );
        insert ntf;
        
        Test.startTest();
        NotificationServices.getUnreadFundsTrackerIds(staffRec.Id);
        Test.stopTest();
    }

    @IsTest
    static void testMarkNotificationRead() {
        Staff__c staffRec = [SELECT Id FROM Staff__c LIMIT 1];
        Funds_Tracker__c fundRec = [SELECT Id FROM Funds_Tracker__c LIMIT 1];
        
        Notifications__c ntf = new Notifications__c(
            Staff__c = staffRec.Id,
            Title__c = 'Test Notification',
            Message__c = 'Test Message',
            Module__c = 'Funds Tracker',
            Type__c = 'Info',
            Record_Id__c = String.valueOf(fundRec.Id),
            Is_Read__c = false
        );
        insert ntf;
        
        Test.startTest();
        NotificationServices.markNotificationRead(fundRec.Id);
        Test.stopTest();
    }

    @IsTest
    static void testMarkNotificationReadNoNotifications() {
        Funds_Tracker__c fundRec = [SELECT Id FROM Funds_Tracker__c LIMIT 1];
        
        Test.startTest();
        NotificationServices.markNotificationRead(fundRec.Id);
        Test.stopTest();
    }

    @IsTest
    static void testGetParticipantFromFundTracker() {
        Funds_Tracker__c fundRec = [SELECT Id, Client__c FROM Funds_Tracker__c LIMIT 1];
        
        Test.startTest();
        NotificationServices.getParticipantFromFundTracker(fundRec.Id);
        Test.stopTest();
    }

    @IsTest
    static void testMarkIncidentNotificationRead() {
        Staff__c staffRec = [SELECT Id, Email_Address__c FROM Staff__c LIMIT 1];
        User usr = [SELECT Id, Email FROM User WHERE Email = :staffRec.Email_Address__c LIMIT 1];
        
        staffRec.Email_Address__c = usr.Email;
        update staffRec;
        
        Funds_Tracker__c fundRec = [SELECT Id FROM Funds_Tracker__c LIMIT 1];
        
        Notifications__c ntf = new Notifications__c(
            Staff__c = staffRec.Id,
            Title__c = 'Test Incident',
            Message__c = 'Test Message',
            Module__c = 'Incident Register',
            Type__c = 'Info',
            Record_Id__c = String.valueOf(fundRec.Id),
            Is_Read__c = false
        );
        insert ntf;
        
        System.runAs(usr) {
            Test.startTest();
            NotificationServices.markIncidentNotificationRead(fundRec.Id);
            Test.stopTest();
        }
    }

    @IsTest
    static void testMarkIncidentNotificationReadNoStaffMatch() {
        Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
        User testUser = new User(
            Alias = 'incidnt',
            Email = 'incident@test.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'Incident',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = prof.Id,
            TimeZoneSidKey = 'America/Los_Angeles',
            UserName = 'incident@test.com'
        );
        insert testUser;
        
        Funds_Tracker__c fundRec = [SELECT Id FROM Funds_Tracker__c LIMIT 1];
        
        System.runAs(testUser) {
            Test.startTest();
            NotificationServices.markIncidentNotificationRead(fundRec.Id);
            Test.stopTest();
        }
    }

    @IsTest
    static void testMarkIncidentNotificationReadNoNotifications() {
        Staff__c staffRec = [SELECT Id, Email_Address__c FROM Staff__c LIMIT 1];
        User usr = [SELECT Id, Email FROM User WHERE Email = :staffRec.Email_Address__c LIMIT 1];
        
        staffRec.Email_Address__c = usr.Email;
        update staffRec;
        
        Funds_Tracker__c fundRec = [SELECT Id FROM Funds_Tracker__c LIMIT 1];
        
        System.runAs(usr) {
            Test.startTest();
            NotificationServices.markIncidentNotificationRead(fundRec.Id);
            Test.stopTest();
        }
    }

    @IsTest
    static void testSendNotificationWithDifferentTypes() {
        Staff__c staffRec = [SELECT Id, Email_Address__c FROM Staff__c LIMIT 1];
        User usr = [SELECT Id, Email FROM User WHERE Email = :staffRec.Email_Address__c LIMIT 1];
        
        Test.startTest();
        System.runAs(usr) {
              Facility__c fac=[Select Id from Facility__c limit 1];
            NotificationServices.sendNotification(usr.Id, 'Test 1', 'Message 1', 'Reimbursement', 'Warning', staffRec.Id,fac.Id);
            NotificationServices.sendNotification(usr.Id, 'Test 2', 'Message 2', 'Incident Register', 'Error', staffRec.Id,fac.Id);
            NotificationServices.sendNotification(usr.Id, 'Test 3', 'Message 3', 'Rejected Shifts', 'Success', staffRec.Id,fac.Id);
        }
        Test.stopTest();
    }
}