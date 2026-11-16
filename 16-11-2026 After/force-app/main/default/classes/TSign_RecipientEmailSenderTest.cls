@isTest
private class TSign_RecipientEmailSenderTest {

    public class EmailRelayMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            res.setBody('{"status":"success"}');
            res.setStatusCode(200);
            return res;
        }
    }

    private static final String E1 = 'one@test.com';
    private static final String E2 = 'two@test.com';
    private static final String E3 = 'three@test.com';
    private static final String RECIPIENTS = E1 + '\n' + E2 + '\n' + E3;
    private static final String NAMES = 'One Name\nTwo Name\nThree Name';

    @testSetup
    static void setupData() {
        Test.setMock(HttpCalloutMock.class, new EmailRelayMock());
        Test.startTest();

        TSign_Organisation__c org = new TSign_Organisation__c(
            Name = 'Test Org',
            Email__c = 'org@example.com',
            Active__c = true
        );
        insert org;

        TSign_Offer_Template__c t = new TSign_Offer_Template__c(
            File_Name__c = 'Test.pdf',
            All_Recipients__c = RECIPIENTS,
            All_Recipient_Names__c = NAMES,
            TSign_Organisation__c = org.Id,
            Current_Recipient_Status__c = 'Pending'
        );
        insert t;

        insert new List<TSign_Child_Signature__c>{
            new TSign_Child_Signature__c(
                TSign_Offer_Template__c = t.Id, Recipient_Email__c = E1, Status__c = 'Pending'),
            new TSign_Child_Signature__c(
                TSign_Offer_Template__c = t.Id, Recipient_Email__c = E2, Status__c = 'Pending'),
            new TSign_Child_Signature__c(
                TSign_Offer_Template__c = t.Id, Recipient_Email__c = E3, Status__c = 'Pending')
        };

        Test.stopTest();
    }

    // ---------- helpers ----------
    private static TSign_Offer_Template__c tmpl() {
        return [
            SELECT Id, All_Recipients__c, All_Recipient_Names__c, Current_Recipient__c,
                   Current_Recipient_Status__c, Link_Token__c, Link_Active__c,
                   Expire__c, TSign_Organisation__c
            FROM TSign_Offer_Template__c
            ORDER BY CreatedDate ASC
            LIMIT 1
        ];
    }

    // reset state: triggers in setup may have changed it
    private static TSign_Offer_Template__c resetTemplate(String current) {
        TSign_Offer_Template__c t = tmpl();
        t.All_Recipients__c = RECIPIENTS;
        t.All_Recipient_Names__c = NAMES;
        t.Current_Recipient__c = current;
        t.Current_Recipient_Status__c = 'Pending';
        t.Link_Token__c = null;
        update t;
        return tmpl();
    }

    private static TSign_Child_Signature__c child(String email) {
        return [
            SELECT Id, TSign_Offer_Template__c, Recipient_Email__c,
                   Email_Secure_Link__c, Link_Token__c
            FROM TSign_Child_Signature__c
            WHERE Recipient_Email__c = :email
            ORDER BY CreatedDate DESC
            LIMIT 1
        ];
    }

    private static Boolean startThrows(Id templateId, String childId) {
        try {
            TSign_RecipientEmailSender.startEmailSequence(templateId, childId);
        } catch (AuraHandledException e) {
            return true;
        }
        return false;
    }

    // ---------- sendToRecipient ----------
    @isTest
    static void testSendToRecipientGuards() {
        TSign_RecipientEmailSender.sendToRecipient(null);
        TSign_RecipientEmailSender.sendToRecipient(new List<TSign_Child_Signature__c>());
        // child with no template -> returns quietly
        TSign_RecipientEmailSender.sendToRecipient(
            new List<TSign_Child_Signature__c>{ new TSign_Child_Signature__c() });
        Assert.isTrue(true);
    }

    @isTest
    static void testSendToRecipientValid() {
        TSign_Offer_Template__c t = resetTemplate(null);
        TSign_Child_Signature__c c1 = child(E1);

        Test.setMock(HttpCalloutMock.class, new EmailRelayMock());
        Test.startTest();
        TSign_RecipientEmailSender.sendToRecipient(new List<TSign_Child_Signature__c>{ c1 });
        Test.stopTest();

        Assert.isTrue(tmpl().Current_Recipient__c == E1);
    }

    // ---------- startEmailSequence ----------
    @isTest
    static void testStartSequenceFirstRecipient() {
        TSign_Offer_Template__c t = resetTemplate(null);
        TSign_Child_Signature__c c1 = child(E1);

        Test.setMock(HttpCalloutMock.class, new EmailRelayMock());
        Test.startTest();
        String res = TSign_RecipientEmailSender.startEmailSequence(t.Id, c1.Id);
        Test.stopTest();

        Assert.isTrue(res == 'Email sent to ' + E1);
        TSign_Offer_Template__c after = tmpl();
        Assert.isTrue(after.Current_Recipient__c == E1);
        Assert.isTrue(after.Current_Recipient_Status__c == 'Pending');
    }

    @isTest
    static void testStartSequenceNextRecipientNoChildId() {
        TSign_Offer_Template__c t = resetTemplate(E1);

        Test.setMock(HttpCalloutMock.class, new EmailRelayMock());
        Test.startTest();
        String res = TSign_RecipientEmailSender.startEmailSequence(t.Id, null);
        Test.stopTest();

        Assert.isTrue(res == 'Email sent to ' + E2);
        Assert.isTrue(tmpl().Current_Recipient__c == E2);
    }

    @isTest
    static void testStartSequenceCaseInsensitiveCurrent() {
        TSign_Offer_Template__c t = resetTemplate('  ONE@TEST.COM ');

        Test.setMock(HttpCalloutMock.class, new EmailRelayMock());
        Test.startTest();
        String res = TSign_RecipientEmailSender.startEmailSequence(t.Id, child(E2).Id);
        Test.stopTest();

        Assert.isTrue(res.contains(E2));
    }

    @isTest
    static void testStartSequenceUnknownCurrentStartsFirst() {
        TSign_Offer_Template__c t = resetTemplate('ghost@test.com');

        Test.setMock(HttpCalloutMock.class, new EmailRelayMock());
        Test.startTest();
        String res = TSign_RecipientEmailSender.startEmailSequence(t.Id, null);
        Test.stopTest();

        Assert.isTrue(res.contains(E1));
    }

    @isTest
    static void testStartSequenceCompleted() {
        TSign_Offer_Template__c t = resetTemplate(E3);

        String res = TSign_RecipientEmailSender.startEmailSequence(t.Id, null);

        Assert.isTrue(res.contains('completed'));
        Assert.isTrue(tmpl().Current_Recipient_Status__c == 'Completed');
    }

    @isTest
    static void testStartSequenceChildMismatch() {
        // next recipient is two, child belongs to one -> error
        TSign_Offer_Template__c t = resetTemplate(E1);
        Assert.isTrue(startThrows(t.Id, child(E1).Id));
    }

    @isTest
    static void testStartSequenceNoRecipients() {
        TSign_Offer_Template__c t = resetTemplate(null);
        t.All_Recipients__c = null;
        update t;
        Assert.isTrue(startThrows(t.Id, null));

        // only blank lines
        t.All_Recipients__c = '\n  \n';
        update t;
        Assert.isTrue(startThrows(t.Id, null));
    }

    @isTest
    static void testStartSequenceNoChildFound() {
        TSign_Offer_Template__c t = resetTemplate(null);
        delete [SELECT Id FROM TSign_Child_Signature__c];
        Assert.isTrue(startThrows(t.Id, null));
    }

    @isTest
    static void testStartSequenceBadTemplate() {
        Id fake = Id.valueOf(TSign_Offer_Template__c.SObjectType.getDescribe().getKeyPrefix() + '000000000001');
        Assert.isTrue(startThrows(fake, null));
    }

    // ---------- sendRecordEmail ----------
    @isTest
    static void testSendRecordEmailValidation() {
        Integer thrown = 0;
        try { TSign_RecipientEmailSender.sendRecordEmail('', '', '', ''); } catch (AuraHandledException e) { thrown++; }
        try { TSign_RecipientEmailSender.sendRecordEmail(tmpl().Id, child(E1).Id, '', 'https://b'); } catch (AuraHandledException e) { thrown++; }
        try { TSign_RecipientEmailSender.sendRecordEmail(tmpl().Id, child(E1).Id, E1, ''); } catch (AuraHandledException e) { thrown++; }
        Assert.isTrue(thrown == 3);
    }

    @isTest
    static void testSendRecordEmailBadChild() {
        Id fakeChild = Id.valueOf(TSign_Child_Signature__c.SObjectType.getDescribe().getKeyPrefix() + '000000000001');
        Boolean thrown = false;
        try {
            TSign_RecipientEmailSender.sendRecordEmail(tmpl().Id, fakeChild, E1, 'https://b');
        } catch (AuraHandledException e) {
            thrown = true;
        }
        Assert.isTrue(thrown);
    }

    @isTest
    static void testSendRecordEmailChildOfOtherTemplate() {
        Test.setMock(HttpCalloutMock.class, new EmailRelayMock());
        TSign_Offer_Template__c other = new TSign_Offer_Template__c(
            File_Name__c = 'Other.pdf',
            All_Recipients__c = E1,
            TSign_Organisation__c = tmpl().TSign_Organisation__c
        );
        insert other;

        Boolean thrown = false;
        try {
            // child belongs to the first template, not "other"
            TSign_RecipientEmailSender.sendRecordEmail(other.Id, child(E1).Id, E1, 'https://b');
        } catch (AuraHandledException e) {
            thrown = true;
        }
        Assert.isTrue(thrown);
    }

    @isTest
    static void testSendRecordEmailFirstRecipient() {
        TSign_Offer_Template__c t = resetTemplate(null);
        TSign_Child_Signature__c c1 = child(E1);

        Test.setMock(HttpCalloutMock.class, new EmailRelayMock());
        Test.startTest();
        TSign_RecipientEmailSender.sendRecordEmail(t.Id, c1.Id, E1, 'https://base.url');
        Test.stopTest();

        TSign_Offer_Template__c after = tmpl();
        Assert.isNotNull(after.Link_Token__c);
        Assert.isTrue(after.Link_Token__c.length() == 64);
        Assert.isTrue(after.Link_Active__c);
        Assert.isNotNull(after.Expire__c);
        Assert.isTrue(child(E1).Email_Secure_Link__c.contains('?t=' + after.Link_Token__c));
    }

    @isTest
    static void testSendRecordEmailLaterRecipient() {
        TSign_Offer_Template__c t = resetTemplate(E1);
        TSign_Child_Signature__c c2 = child(E2);

        Test.setMock(HttpCalloutMock.class, new EmailRelayMock());
        Test.startTest();
        TSign_RecipientEmailSender.sendRecordEmail(t.Id, c2.Id, E2, 'https://base.url');
        Test.stopTest();

        // token goes on the child, template token stays empty
        TSign_Child_Signature__c after = child(E2);
        Assert.isNotNull(after.Link_Token__c);
        Assert.isNull(tmpl().Link_Token__c);
        Assert.isTrue(after.Email_Secure_Link__c.contains('?t='));
    }

    @isTest
    static void testSendRecordEmailNoOrgDefaultsAndNoRecipientList() {
        TSign_Offer_Template__c t = resetTemplate(null);
        t.TSign_Organisation__c = null;
        t.All_Recipients__c = null;
        t.All_Recipient_Names__c = null;
        update t;

        Test.setMock(HttpCalloutMock.class, new EmailRelayMock());
        Test.startTest();
        TSign_RecipientEmailSender.sendRecordEmail(t.Id, child(E1).Id, E1, 'https://base.url');
        Test.stopTest();

        Assert.isNotNull(child(E1).Email_Secure_Link__c);
    }

    // ---------- helpers ----------
    @isTest
    static void testBuildExpiryNote() {
        Assert.isTrue(TSign_RecipientEmailSender.buildExpiryNote(null, null).contains('14 days'));

        String note = TSign_RecipientEmailSender.buildExpiryNote(System.now().addDays(14), 'America/New_York');
        Assert.isTrue(note.contains('<strong>'));
        Assert.isTrue(note.contains('(UTC+00:00)'));
    }

    @isTest
    static void testResolveRecipientName() {
        // saved name found, case/space insensitive
        Assert.isTrue(TSign_RecipientEmailSender.resolveRecipientName(
            'a@b.com\nc@d.com', 'Alice\n Charlie ', ' C@D.com ') == 'Charlie');

        // no names -> derived from email
        Assert.isTrue(TSign_RecipientEmailSender.resolveRecipientName(
            'a@b.com\nc@d.com', null, 'john.smith@x.com') == 'John smith');

        // blank name at that position -> derived
        Assert.isTrue(TSign_RecipientEmailSender.resolveRecipientName(
            'a@b.com\nc@d.com', 'Alice\n', 'c@d.com') == 'C');

        // email not in list -> derived
        Assert.isTrue(TSign_RecipientEmailSender.resolveRecipientName(
            'a@b.com', 'Alice', 'zed@x.com') == 'Zed');

        // blank recipients -> derived
        Assert.isTrue(TSign_RecipientEmailSender.resolveRecipientName(
            null, null, 'bob@x.com') == 'Bob');
    }
}