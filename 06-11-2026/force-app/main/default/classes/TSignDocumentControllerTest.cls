@isTest
private class TSignDocumentControllerTest {

    private static final String UNAME = 'tsigndoc.user.4139562@test.com';
    private static final String ORG_NAME = 'TSign Docs Org';
    private static final String EMPTY_ORG_NAME = 'TSign Empty Org';

    private class HttpMock implements HttpCalloutMock {
        Integer code;
        HttpMock(Integer code) { this.code = code; }
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(code);
            res.setHeader('Content-Type', 'application/json');
            res.setBody('{"status":"success"}');
            return res;
        }
    }

    // static flag resets per test method, so call this at the start of every test
    private static void bypass() {
        TriggerUtility.bypassTrigger = true;
    }

    // facility = whatever object TSign_Offer_Template__c.TSign_Facility__c points to
    private static Id makeFacility(Id orgId) {
        Schema.SObjectType ft = Schema.SObjectType.TSign_Offer_Template__c.fields.TSign_Facility__c.getReferenceTo()[0];
        SObject f = ft.newSObject();
        f.put('Name', 'Test Facility');
        try { f.put('TSign_Organisation__c', orgId); } catch (Exception e) {}
        try { f.put('Active__c', true); } catch (Exception e) {}
        insert f;
        return f.Id;
    }

    @TestSetup
    static void setup() {
        bypass();
        Test.setMock(HttpCalloutMock.class, new HttpMock(200));

        TSign_Organisation__c org = new TSign_Organisation__c(Name = ORG_NAME, Email__c = 'org@test.com');
        TSign_Organisation__c empty = new TSign_Organisation__c(Name = EMPTY_ORG_NAME, Email__c = 'empty@test.com');
        insert new List<TSign_Organisation__c>{ org, empty };

        Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
        User u = new User(
            Alias = 'tsdoc', Email = UNAME, EmailEncodingKey = 'UTF-8',
            LastName = 'TSign Doc Test', LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US', ProfileId = prof.Id,
            TimeZoneSidKey = 'America/New_York', UserName = UNAME,
            User_Type__c = 'T Sign Org Admin',
            TSign_Org_Id__c = String.valueOf(org.Id));
        System.runAs(new User(Id = UserInfo.getUserId())) {
            insert u;
        }

        // data created AS the test user so CreatedById = test user
        System.runAs(u) {
            Test.startTest();
            Id fac = makeFacility(org.Id);
            String me = UNAME;

            // Current_Recipient__c / status NOT set here: the child insert trigger
            // runs the email sequence and needs them empty. They are set after.
            List<TSign_Offer_Template__c> ts = new List<TSign_Offer_Template__c>{
                new TSign_Offer_Template__c(File_Name__c = 'ActionDoc', Type__c = 'Default',
                    TSign_Organisation__c = org.Id, TSign_Facility__c = fac,
                    All_Recipients__c = me + '\nother@test.com',
                    All_Recipient_Names__c = 'Me Name\nOther Name',
                    Amazon_Url__c = 'https://s/action.pdf'),
                new TSign_Offer_Template__c(File_Name__c = 'WaitDoc', Type__c = 'Default',
                    TSign_Organisation__c = org.Id, TSign_Facility__c = fac,
                    All_Recipients__c = 'other@test.com',
                    Amazon_Url__c = 'https://s/wait.pdf'),
                new TSign_Offer_Template__c(File_Name__c = 'DoneMulti', Type__c = 'Default',
                    TSign_Organisation__c = org.Id, TSign_Facility__c = fac,
                    All_Recipients__c = 'a@test.com\n' + me),
                new TSign_Offer_Template__c(File_Name__c = 'DoneMultiNoSig', Type__c = 'Default',
                    TSign_Organisation__c = org.Id, TSign_Facility__c = fac,
                    All_Recipients__c = 'a@test.com\n' + me),
                new TSign_Offer_Template__c(File_Name__c = 'DoneSingle', Type__c = 'Default',
                    TSign_Organisation__c = org.Id, TSign_Facility__c = fac,
                    All_Recipients__c = me,
                    Amazon_Url__c = 'https://s/single.pdf'),
                new TSign_Offer_Template__c(File_Name__c = 'DoneNoChild', Type__c = 'Default',
                    TSign_Organisation__c = org.Id, TSign_Facility__c = fac,
                    All_Recipients__c = me),
                new TSign_Offer_Template__c(File_Name__c = 'FallbackDoc', Type__c = 'Default',
                    TSign_Organisation__c = org.Id, TSign_Facility__c = fac,
                    All_Recipients__c = 'x@test.com'),
                new TSign_Offer_Template__c(File_Name__c = 'QuoteDoc', Type__c = 'Quote',
                    TSign_Organisation__c = org.Id, All_Recipients__c = me)
            };
            insert ts;

            Map<String, Id> idBy = new Map<String, Id>();
            for (TSign_Offer_Template__c t : ts) {
                idBy.put(t.File_Name__c, t.Id);
            }

            // every child email = first recipient of its template
            insert new List<TSign_Child_Signature__c>{
                new TSign_Child_Signature__c(TSign_Offer_Template__c = idBy.get('ActionDoc'), Recipient_Email__c = me,
                    Email_Secure_Link__c = 'https://s/1', Expire__c = System.now().addHours(12)),
                new TSign_Child_Signature__c(TSign_Offer_Template__c = idBy.get('WaitDoc'), Recipient_Email__c = 'other@test.com',
                    Email_Secure_Link__c = 'https://s/2', Expire__c = System.now().addDays(3)),
                new TSign_Child_Signature__c(TSign_Offer_Template__c = idBy.get('DoneMulti'), Recipient_Email__c = 'a@test.com',
                    Signature_URL__c = 'https://s/sig.png'),
                new TSign_Child_Signature__c(TSign_Offer_Template__c = idBy.get('DoneMultiNoSig'), Recipient_Email__c = 'a@test.com'),
                new TSign_Child_Signature__c(TSign_Offer_Template__c = idBy.get('DoneSingle'), Recipient_Email__c = me),
                new TSign_Child_Signature__c(TSign_Offer_Template__c = idBy.get('FallbackDoc'), Recipient_Email__c = 'x@test.com',
                    Expire__c = System.now().addDays(3))
            };
            Test.stopTest();
        }

        // now set recipient + status (trigger may have changed them)
        List<TSign_Offer_Template__c> all = [SELECT Id, File_Name__c FROM TSign_Offer_Template__c];
        for (TSign_Offer_Template__c t : all) {
            if (t.File_Name__c == 'ActionDoc') {
                t.Current_Recipient__c = UNAME;
                t.Current_Recipient_Status__c = 'Pending';
            } else if (t.File_Name__c == 'WaitDoc') {
                t.Current_Recipient__c = 'other@test.com';
                t.Current_Recipient_Status__c = 'Pending';
            } else if (t.File_Name__c.startsWith('Done')) {
                t.Current_Recipient__c = UNAME;
                t.Current_Recipient_Status__c = 'Completed';
            }
        }
        update all;
    }

    // ---------- helpers ----------
    private static User u() {
        return [SELECT Id, Email FROM User WHERE Username = :UNAME LIMIT 1];
    }

    private static void setUserType(String userType) {
        User x = u();
        x.User_Type__c = userType;
        System.runAs(new User(Id = UserInfo.getUserId())) {
            update x;
        }
    }

    private static Id orgId() {
        return [SELECT Id FROM TSign_Organisation__c WHERE Name = :ORG_NAME LIMIT 1].Id;
    }

    private static Id emptyOrgId() {
        return [SELECT Id FROM TSign_Organisation__c WHERE Name = :EMPTY_ORG_NAME LIMIT 1].Id;
    }

    private static Id facId() {
        return [SELECT TSign_Facility__c FROM TSign_Offer_Template__c WHERE File_Name__c = 'ActionDoc' LIMIT 1].TSign_Facility__c;
    }

    private static Id tId(String fileName) {
        return [SELECT Id FROM TSign_Offer_Template__c WHERE File_Name__c = :fileName LIMIT 1].Id;
    }

    private static Id fakeId(Schema.SObjectType t) {
        return Id.valueOf(t.getDescribe().getKeyPrefix() + '000000000001');
    }

    // ---------- getDocumentRecords ----------
    @isTest
    static void testGetDocumentRecordsAdmin() {
        bypass();
        System.runAs(u()) {
            String o = String.valueOf(orgId());

            Assert.isTrue(TSignDocumentController.getDocumentRecords(o, '').isEmpty());
            Assert.isTrue(TSignDocumentController.getDocumentRecords(o, null).isEmpty());

            List<Map<String, Object>> rows = TSignDocumentController.getDocumentRecords(o, String.valueOf(facId()));
            Assert.isTrue(rows.size() >= 6);

            Boolean sawSig = false;
            Boolean sawNoSig = false;
            for (Map<String, Object> r : rows) {
                if ((String) r.get('FileName') == 'DoneMulti' && (String) r.get('SignatureURL') == 'https://s/sig.png') {
                    sawSig = true;
                }
                if ((String) r.get('FileName') == 'ActionDoc' && r.get('SignatureURL') == null) {
                    sawNoSig = true;
                }
            }
            Assert.isTrue(sawSig);
            Assert.isTrue(sawNoSig);
        }
    }

    @isTest
    static void testGetDocumentRecordsNonAdmin() {
        bypass();
        setUserType(null);
        System.runAs(u()) {
            List<Map<String, Object>> rows =
                TSignDocumentController.getDocumentRecords(String.valueOf(orgId()), String.valueOf(facId()));
            Assert.isFalse(rows.isEmpty());
        }
    }

    // ---------- fetchPDF ----------
    @isTest
    static void testFetchPDF() {
        Test.setMock(HttpCalloutMock.class, new HttpMock(200));
        Test.startTest();
        Assert.isNotNull(TSignDocumentController.fetchPDF('https://example.com/test.pdf'));
        Test.stopTest();
    }

    @isTest
    static void testFetchPDFErrors() {
        Test.setMock(HttpCalloutMock.class, new HttpMock(500));
        Test.startTest();
        Integer thrown = 0;
        try { TSignDocumentController.fetchPDF('https://example.com/test.pdf'); } catch (AuraHandledException e) { thrown++; }
        try { TSignDocumentController.fetchPDF(''); } catch (AuraHandledException e) { thrown++; }
        Test.stopTest();
        Assert.isTrue(thrown == 2);
    }

    // ---------- comments ----------
    @isTest
    static void testComments() {
        bypass();
        System.runAs(u()) {
            Id t = tId('ActionDoc');
            Assert.isTrue(TSignDocumentController.getComments(t, 'x') == '[]');

            TSignDocumentController.updateComments(t, '{"author":"A","comment":"hi"}');
            TSignDocumentController.updateComments(t, '{"author":"B","comment":"again"}');

            String saved = TSignDocumentController.getComments(t, 'y');
            Assert.isTrue(saved.contains('again'));
            List<Object> parsed = (List<Object>) JSON.deserializeUntyped(saved);
            Assert.isTrue(parsed.size() == 2);

            // nested array gets flattened
            TSign_Offer_Template__c rec = [SELECT Id FROM TSign_Offer_Template__c WHERE Id = :t];
            rec.Comments__c = '[[{"a":1}],{"b":2}]';
            update rec;
            TSignDocumentController.updateComments(t, '{"c":3}');
            Assert.isFalse(TSignDocumentController.getComments(t, 'z').contains('[['));
        }
    }

    @isTest
    static void testCommentsErrors() {
        bypass();
        System.runAs(u()) {
            Id t = tId('ActionDoc');
            Integer thrown = 0;
            try { TSignDocumentController.updateComments(null, 'x'); } catch (AuraHandledException e) { thrown++; }
            try { TSignDocumentController.updateComments(t, ''); } catch (AuraHandledException e) { thrown++; }

            TSign_Offer_Template__c rec = [SELECT Id FROM TSign_Offer_Template__c WHERE Id = :t];
            rec.Comments__c = 'not json';
            update rec;
            try { TSignDocumentController.updateComments(t, '{"a":1}'); } catch (AuraHandledException e) { thrown++; }
            Assert.isTrue(thrown == 3);
        }
    }

    @isTest
    static void testFlattenComments() {
        List<Object> nested = new List<Object>{
            'Comment 1',
            new List<Object>{ 'Comment 2', new List<Object>{ 'Comment 3', 'Comment 4' }, 'Comment 5' },
            'Comment 6'
        };
        Assert.isTrue(TSignDocumentController.flattenComments(nested).size() == 6);
    }

    // ---------- participant templates ----------
    @isTest
    static void testParticipantTemplatesAdmin() {
        bypass();
        System.runAs(u()) {
            Id o = orgId();
            Id tid = TSignDocumentController.createTemplate(
                'Doc A', 'Created Template', o, 'https://u/a', '{}');
            Assert.isNotNull(tid);

            Assert.isFalse(TSignDocumentController.getTemplates(o).isEmpty());
            Assert.isFalse(TSignDocumentController.getTemplatesCT(o).isEmpty());

            TSignDocumentController.updateTemplate(tid, 'Doc B', 'Created Template', 'https://u/b', '{"a":1}');
            Assert.isTrue([SELECT Document_Name__c FROM TSign_Participant_Template__c WHERE Id = :tid].Document_Name__c == 'Doc B');

            // blank url / json -> not overwritten
            TSignDocumentController.updateTemplate(tid, 'Doc C', 'Created Template', '', '');
            Assert.isTrue([SELECT AWS_Document__c FROM TSign_Participant_Template__c WHERE Id = :tid].AWS_Document__c == 'https://u/b');

            TSignDocumentController.awsupdateTemplate(tid, 'https://u/c', '{"z":1}');
            Assert.isTrue([SELECT AWS_Document__c FROM TSign_Participant_Template__c WHERE Id = :tid].AWS_Document__c == 'https://u/c');
        }
    }

    @isTest
    static void testParticipantTemplatesNonAdmin() {
        bypass();
        setUserType(null);
        System.runAs(u()) {
            Id o = orgId();
            TSignDocumentController.createTemplate('Doc N', 'Created Template', o, 'https://u/n', '{}');
            Assert.isFalse(TSignDocumentController.getTemplates(o).isEmpty());
            Assert.isFalse(TSignDocumentController.getTemplatesCT(o).isEmpty());
        }
    }

    @isTest
    static void testParticipantTemplatesErrors() {
        Integer thrown = 0;
        try { TSignDocumentController.getTemplates(null); } catch (AuraHandledException e) { thrown++; }
        try { TSignDocumentController.getTemplatesCT(null); } catch (AuraHandledException e) { thrown++; }
        Assert.isTrue(thrown == 2);
    }

    @isTest
    static void testGetAllTemplates() {
        bypass();
        System.runAs(u()) {
            Id o = orgId();
            insert new TSign_Template__c(Organisation_Id__c = String.valueOf(o), File_Name__c = 'CoverageTest.pdf');
            Assert.isFalse(TSignDocumentController.getAllTemplates(o).isEmpty());
            Assert.isTrue(TSignDocumentController.getAllTemplates(emptyOrgId()).isEmpty());
        }
    }

    // ---------- quote records ----------
    @isTest
    static void testGetQuoteDocumentRecords() {
        bypass();
        System.runAs(u()) {
            List<Map<String, Object>> rows = TSignDocumentController.getQuoteDocumentRecords(String.valueOf(orgId()));
            Assert.isNotNull(rows);

            Boolean thrown = false;
            try {
                TSignDocumentController.getQuoteDocumentRecords('');
            } catch (AuraHandledException e) {
                thrown = true;
            }
            Assert.isTrue(thrown);
        }
    }

    // ---------- dashboard counts ----------
    @isTest
    static void testGetDashboardCounts() {
        bypass();
        System.runAs(u()) {
            TSignDocumentController.DashboardCounts c = TSignDocumentController.getDashboardCounts(String.valueOf(orgId()));
            Assert.isTrue(c.actionRequired >= 1);
            Assert.isTrue(c.waitingForOthers >= 1);
            Assert.isTrue(c.completed >= 1);
            Assert.isTrue(c.expiringSoon >= 1);
            Assert.isTrue(c.expiring24Hours >= 1);
        }
    }

    @isTest
    static void testGetDashboardCountsEmptyAndErrors() {
        bypass();
        System.runAs(u()) {
            TSignDocumentController.DashboardCounts c = TSignDocumentController.getDashboardCounts(String.valueOf(emptyOrgId()));
            Assert.isTrue(c.actionRequired == 0);
            Assert.isTrue(c.completed == 0);
        }
        Boolean thrown = false;
        try {
            TSignDocumentController.getDashboardCounts(null);
        } catch (AuraHandledException e) {
            thrown = true;
        }
        Assert.isTrue(thrown);
    }

    // ---------- dashboard records ----------
    @isTest
    static void testDashboardActionRequired() {
        bypass();
        System.runAs(u()) {
            List<TSignDocumentController.DashboardRecord> rows =
                TSignDocumentController.getDashboardRecords(String.valueOf(orgId()), 'actionRequired');
            Assert.isFalse(rows.isEmpty());

            Boolean found = false;
            for (TSignDocumentController.DashboardRecord r : rows) {
                if (r.fileName == 'ActionDoc') {
                    found = true;
                    Assert.isTrue(r.status == 'Pending');
                    Assert.isTrue(r.currentRecipientName == 'Me Name');
                    Assert.isTrue(r.recipientListDisplay.contains('Other Name'));
                    Assert.isNotNull(r.createdByInitials);
                }
            }
            Assert.isTrue(found);
        }
    }

    @isTest
    static void testDashboardWaitingForOthers() {
        bypass();
        System.runAs(u()) {
            Assert.isFalse(TSignDocumentController.getDashboardRecords(
                String.valueOf(orgId()), 'waitingForOthers').isEmpty());
        }
    }

    @isTest
    static void testDashboardCompleted() {
        bypass();
        System.runAs(u()) {
            List<TSignDocumentController.DashboardRecord> rows =
                TSignDocumentController.getDashboardRecords(String.valueOf(orgId()), 'completed');
            Assert.isTrue(rows.size() >= 4);
        }
    }

    @isTest
    static void testDashboardExpiringSoon() {
        bypass();
        System.runAs(u()) {
            List<TSignDocumentController.DashboardRecord> rows =
                TSignDocumentController.getDashboardRecords(String.valueOf(orgId()), 'expiringSoon');
            Assert.isTrue(rows.size() >= 2);

            Boolean high = false;
            Boolean medium = false;
            for (TSignDocumentController.DashboardRecord r : rows) {
                if (r.expiryType == 'HIGH') high = true;
                if (r.expiryType == 'MEDIUM') medium = true;
            }
            Assert.isTrue(high);
            Assert.isTrue(medium);
        }
    }

    @isTest
    static void testDashboardRecordsEmptyAndErrors() {
        bypass();
        System.runAs(u()) {
            Assert.isTrue(TSignDocumentController.getDashboardRecords(
                String.valueOf(emptyOrgId()), 'actionRequired').isEmpty());

            Integer thrown = 0;
            try { TSignDocumentController.getDashboardRecords('', 'completed'); } catch (AuraHandledException e) { thrown++; }
            try { TSignDocumentController.getDashboardRecords(String.valueOf(orgId()), ''); } catch (AuraHandledException e) { thrown++; }
            try { TSignDocumentController.getDashboardRecords(String.valueOf(orgId()), 'bogus'); } catch (AuraHandledException e) { thrown++; }
            Assert.isTrue(thrown == 3);
        }
    }

    // ---------- recent activities ----------
    @isTest
    static void testGetRecentActivities() {
        bypass();
        System.runAs(u()) {
            List<TSignDocumentController.RecentActivity> acts = TSignDocumentController.getRecentActivities(orgId());
            Assert.isFalse(acts.isEmpty());

            Boolean sawAction = false;
            Boolean sawWaiting = false;
            for (TSignDocumentController.RecentActivity a : acts) {
                if (a.category == 'Action Required') sawAction = true;
                if (a.category == 'Waiting for Others') sawWaiting = true;
                Assert.isNotNull(a.description);
            }
            Assert.isTrue(sawAction);
            Assert.isTrue(sawWaiting);

            Assert.isTrue(TSignDocumentController.getRecentActivities(emptyOrgId()).isEmpty());
        }
    }

    @isTest
    static void testGetRecentActivitiesBlankOrg() {
        Boolean thrown = false;
        try {
            TSignDocumentController.getRecentActivities(null);
        } catch (AuraHandledException e) {
            thrown = true;
        }
        Assert.isTrue(thrown);
    }

    // ---------- reminders ----------
    @isTest
    static void testSendSignatureReminders() {
        bypass();
        System.runAs(u()) {
            Id o = orgId();

            // hours from now -> hits every status / remaining time branch
            List<Integer> hours = new List<Integer>{ 12, 36, 8 * 24, 15 * 24, 22 * 24, 40 * 24, -5 };

            // no Current_Recipient__c / status at insert (child trigger needs them empty)
            List<TSign_Offer_Template__c> ts = new List<TSign_Offer_Template__c>();
            for (Integer i = 0; i < hours.size(); i++) {
                ts.add(new TSign_Offer_Template__c(
                    File_Name__c = 'Rem' + i, Type__c = 'Default', TSign_Organisation__c = o,
                    All_Recipients__c = 'rem' + i + '@test.com'));
            }
            // pending, no current recipient, no child -> skipped
            ts.add(new TSign_Offer_Template__c(
                File_Name__c = 'RemNone', Type__c = 'Default', TSign_Organisation__c = o,
                All_Recipients__c = 'none@test.com'));
            insert ts;

            List<TSign_Child_Signature__c> kids = new List<TSign_Child_Signature__c>();
            for (Integer i = 0; i < hours.size(); i++) {
                kids.add(new TSign_Child_Signature__c(
                    TSign_Offer_Template__c = ts[i].Id, Recipient_Email__c = 'rem' + i + '@test.com',
                    Email_Secure_Link__c = 'https://s/rem' + i,
                    Expire__c = System.now().addHours(hours[i])));
            }
            insert kids;

            // set recipient + status after children exist
            for (Integer i = 0; i < hours.size(); i++) {
                ts[i].Current_Recipient__c = 'rem' + i + '@test.com';
                ts[i].Current_Recipient_Status__c = 'Pending';
            }
            ts[hours.size()].Current_Recipient_Status__c = 'Pending';
            update ts;

            List<Id> ids = new List<Id>();
            for (TSign_Offer_Template__c t : ts) {
                ids.add(t.Id);
            }
            ids.add(tId('DoneSingle')); // completed -> skipped

            Test.setMock(HttpCalloutMock.class, new HttpMock(200));
            Test.startTest();
            Integer sent = TSignDocumentController.sendSignatureReminders(ids);
            Test.stopTest();

            Assert.isTrue(sent > 0);
        }
    }

    @isTest
    static void testSendSignatureRemindersNothingToSend() {
        bypass();
        System.runAs(u()) {
            Assert.isTrue(TSignDocumentController.sendSignatureReminders(
                new List<Id>{ fakeId(TSign_Offer_Template__c.SObjectType) }) == 0);

            Assert.isTrue(TSignDocumentController.sendSignatureReminders(
                new List<Id>{ tId('DoneSingle') }) == 0);
        }
    }

    @isTest
    static void testSendSignatureRemindersErrors() {
        bypass();
        Integer thrown = 0;
        try { TSignDocumentController.sendSignatureReminders(null); } catch (AuraHandledException e) { thrown++; }
        try { TSignDocumentController.sendSignatureReminders(new List<Id>()); } catch (AuraHandledException e) { thrown++; }

        // user with no org -> org query returns nothing -> QueryException
        User x = u();
        x.TSign_Org_Id__c = null;
        System.runAs(new User(Id = UserInfo.getUserId())) {
            update x;
        }
        System.runAs(u()) {
            try {
                TSignDocumentController.sendSignatureReminders(new List<Id>{ tId('ActionDoc') });
            } catch (Exception e) {
                thrown++;
            }
        }
        Assert.isTrue(thrown == 3);
    }
}