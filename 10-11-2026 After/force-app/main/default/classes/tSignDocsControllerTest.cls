@isTest
private class tSignDocsControllerTest {

    private static final String UNAME = 'manualtesting.4139562e232@hotmail.com';
    private static final String ORG_NAME = 'Ashfield Consultants';
    private static final String EMPTY_ORG_NAME = 'Empty Org';

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

    // ---------- setup ----------
    private static Organisation__c buildOrg(String name) {
        Organisation__c org = new Organisation__c();
        org.Name = name;
        org.ABN__c = '11234567891';
        org.ACN__c = '878787878';
        org.Contact_No__c = '6132899740';
        org.RCTI__c = 'RCTI1';
        org.Email__c = 'dsfdsfsd@gmail.com';
        org.Bank__c = 'Bank Test';
        org.BSB__c = 'BSB Test';
        org.Account_Name__c = 'Test Account';
        org.Account_Number__c = '1111111111';
        org.Description__c = 'test Desc';
        org.Address_Latest__Street__s = '101';
        org.Address_Latest__City__s = 'Himas Waterhen';
        org.Address_Latest__PostalCode__s = '2060';
        org.Address_Latest__CountryCode__s = 'AU';
        org.Address_Latest__StateCode__s = 'NSW';
        org.NDIS_Provider__c = '12341234565';
        org.BMSI_Identifier__c = 'TEST BMSI';
        org.SoftwareId__c = 'jhdfn18328';
        org.Branch_code__c = 'BS123';
        org.Contact_Name__c = 'Test Contact';
        org.User_Type__c = 'NDIS Org Admin';
        return org;
    }

    private static Id makeFacility(Id orgId) {
        Facility__c fac = new Facility__c(
            Name = 'Ashfield Consultants',
            Address__City__s = 'Crace',
            Address__Street__s = '8 Keewong Street',
            Address__StateCode__s = 'ACT',
            Address__PostalCode__s = '2911',
            Address__CountryCode__s = 'AU',
            Email__c = 'testonefacility@gmail.com',
            Status__c = true,
            Organisation__c = orgId,
            ABN__c = '12345678912',
            Phone__c = '12323432',
            Type_of_Service__c = 'Ndis'
        );
        insert fac;
        return fac.Id;
    }

    @TestSetup
    static void setup() {
        TriggerUtility.bypassTrigger = true;

        Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];

        User u = new User(
            Alias = 'praveen', Email = UNAME, EmailEncodingKey = 'UTF-8',
            LastName = 'Test Friday4039562', LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US', ProfileId = prof.Id,
            TimeZoneSidKey = 'America/New_York', UserName = UNAME,
            Organization_Name__c = ORG_NAME, User_Type__c = 'NDIS Org Admin');
        System.runAs(new User(Id = UserInfo.getUserId())) {
            insert u;
        }

        // data created AS the test user, so CreatedById = test user
        System.runAs(u) {
            Organisation__c org = buildOrg(ORG_NAME);
            Organisation__c empty = buildOrg(EMPTY_ORG_NAME);
            insert new List<Organisation__c>{ org, empty };

            Id fac = makeFacility(org.Id);
            String me = UNAME;

            List<Offer_Template__c> ts = new List<Offer_Template__c>{
                new Offer_Template__c(File_Name__c = 'ActionDoc', Type__c = 'Default',
                    Orgnisation_Id__c = org.Id, Facility__c = fac,
                    All_Recipients__c = me + '\nother@test.com',
                    Current_Recipient__c = me, Current_Recipient_Status__c = 'Pending',
                    Amazon_Url__c = 'https://s/action.pdf'),
                new Offer_Template__c(File_Name__c = 'WaitDoc', Type__c = 'Default',
                    Orgnisation_Id__c = org.Id, Facility__c = fac,
                    All_Recipients__c = 'other@test.com',
                    Current_Recipient__c = 'other@test.com', Current_Recipient_Status__c = 'Pending',
                    Amazon_Url__c = 'https://s/wait.pdf'),
                new Offer_Template__c(File_Name__c = 'DoneMulti', Type__c = 'Default',
                    Orgnisation_Id__c = org.Id, Facility__c = fac,
                    All_Recipients__c = 'a@test.com\n' + me,
                    Current_Recipient__c = me, Current_Recipient_Status__c = 'Completed'),
                new Offer_Template__c(File_Name__c = 'DoneMultiNoSig', Type__c = 'Default',
                    Orgnisation_Id__c = org.Id, Facility__c = fac,
                    All_Recipients__c = 'a@test.com\n' + me,
                    Current_Recipient__c = me, Current_Recipient_Status__c = 'Completed'),
                new Offer_Template__c(File_Name__c = 'DoneSingle', Type__c = 'Default',
                    Orgnisation_Id__c = org.Id, Facility__c = fac,
                    All_Recipients__c = me,
                    Current_Recipient__c = me, Current_Recipient_Status__c = 'Completed',
                    Amazon_Url__c = 'https://s/single.pdf'),
                new Offer_Template__c(File_Name__c = 'DoneNoChild', Type__c = 'Default',
                    Orgnisation_Id__c = org.Id, Facility__c = fac,
                    All_Recipients__c = me,
                    Current_Recipient__c = me, Current_Recipient_Status__c = 'Completed'),
                new Offer_Template__c(File_Name__c = 'FallbackDoc', Type__c = 'Default',
                    Orgnisation_Id__c = org.Id, Facility__c = fac,
                    All_Recipients__c = 'x@test.com'),
                new Offer_Template__c(File_Name__c = 'QuoteDoc', Type__c = 'Quote',
                    Orgnisation_Id__c = org.Id, All_Recipients__c = me)
            };
            insert ts;

            Map<String, Id> idBy = new Map<String, Id>();
            for (Offer_Template__c t : ts) {
                idBy.put(t.File_Name__c, t.Id);
            }

            insert new List<Child_Signatures__c>{
                new Child_Signatures__c(Offer_Template__c = idBy.get('ActionDoc'), Recipient_Email__c = me,
                    Email_Secure_Link__c = 'https://s/1', Expire__c = System.now().addHours(12)),
                new Child_Signatures__c(Offer_Template__c = idBy.get('WaitDoc'), Recipient_Email__c = 'other@test.com',
                    Email_Secure_Link__c = 'https://s/2', Expire__c = System.now().addDays(3)),
                new Child_Signatures__c(Offer_Template__c = idBy.get('DoneMulti'), Recipient_Email__c = 'a@test.com',
                    Signature_URL__c = 'https://s/sig.png'),
                new Child_Signatures__c(Offer_Template__c = idBy.get('DoneMultiNoSig'), Recipient_Email__c = 'a@test.com'),
                new Child_Signatures__c(Offer_Template__c = idBy.get('DoneSingle'), Recipient_Email__c = me),
                new Child_Signatures__c(Offer_Template__c = idBy.get('FallbackDoc'), Recipient_Email__c = 'x@test.com',
                    Expire__c = System.now().addDays(3))
            };
        }
    }

    // ---------- helpers ----------
    private static void bypass() {
        TriggerUtility.bypassTrigger = true;
    }

    private static User u() {
        return [SELECT Id, Email FROM User WHERE Username = :UNAME LIMIT 1];
    }

    private static void setUser(String userType, String orgName) {
        User x = u();
        x.User_Type__c = userType;
        x.Organization_Name__c = orgName;
        System.runAs(new User(Id = UserInfo.getUserId())) {
            update x;
        }
    }

    private static Id orgId() {
        return [SELECT Id FROM Organisation__c WHERE Name = :ORG_NAME LIMIT 1].Id;
    }

    private static Id emptyOrgId() {
        return [SELECT Id FROM Organisation__c WHERE Name = :EMPTY_ORG_NAME LIMIT 1].Id;
    }

    private static Id tId(String fileName) {
        return [SELECT Id FROM Offer_Template__c WHERE File_Name__c = :fileName LIMIT 1].Id;
    }

    // ---------- getDocumentRecords ----------
    @isTest
    static void testGetDocumentRecordsAdmin() {
        bypass();
        System.runAs(u()) {
            List<Map<String, Object>> rows =
                tSignDocsController.getDocumentRecords(String.valueOf(orgId()));
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
        setUser(null, ORG_NAME);
        System.runAs(u()) {
            List<Map<String, Object>> rows =
                tSignDocsController.getDocumentRecords(String.valueOf(orgId()));
            Assert.isFalse(rows.isEmpty());
        }
    }

    // ---------- fetchPDF ----------
    @isTest
    static void testFetchPDF() {
        Test.setMock(HttpCalloutMock.class, new HttpMock(200));
        Test.startTest();
        Assert.isNotNull(tSignDocsController.fetchPDF('https://example.com/test.pdf'));
        Test.stopTest();
    }

    @isTest
    static void testFetchPDFErrors() {
        Test.setMock(HttpCalloutMock.class, new HttpMock(500));
        Test.startTest();
        Integer thrown = 0;
        try { tSignDocsController.fetchPDF('https://example.com/test.pdf'); } catch (AuraHandledException e) { thrown++; }
        try { tSignDocsController.fetchPDF(''); } catch (AuraHandledException e) { thrown++; }
        Test.stopTest();
        Assert.isTrue(thrown == 2);
    }

    // ---------- comments ----------
    @isTest
    static void testComments() {
        bypass();
        System.runAs(u()) {
            Id t = tId('ActionDoc');
            Assert.isTrue(tSignDocsController.getComments(t, 'x') == '[]');

            tSignDocsController.updateComments(t, '{"author":"A","comment":"hi"}');
            tSignDocsController.updateComments(t, '{"author":"B","comment":"again"}');

            String saved = tSignDocsController.getComments(t, 'y');
            Assert.isTrue(saved.contains('again'));
            List<Object> parsed = (List<Object>) JSON.deserializeUntyped(saved);
            Assert.isTrue(parsed.size() == 2);

            // nested array gets flattened
            Offer_Template__c rec = [SELECT Id FROM Offer_Template__c WHERE Id = :t];
            rec.Comments__c = '[[{"a":1}],{"b":2}]';
            update rec;
            tSignDocsController.updateComments(t, '{"c":3}');
            Assert.isFalse(tSignDocsController.getComments(t, 'z').contains('[['));
        }
    }

    @isTest
    static void testCommentsErrors() {
        bypass();
        System.runAs(u()) {
            Id t = tId('ActionDoc');
            Integer thrown = 0;
            try { tSignDocsController.updateComments(null, 'x'); } catch (AuraHandledException e) { thrown++; }
            try { tSignDocsController.updateComments(t, ''); } catch (AuraHandledException e) { thrown++; }

            Offer_Template__c rec = [SELECT Id FROM Offer_Template__c WHERE Id = :t];
            rec.Comments__c = 'not json';
            update rec;
            try { tSignDocsController.updateComments(t, '{"a":1}'); } catch (AuraHandledException e) { thrown++; }
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
        Assert.isTrue(tSignDocsController.flattenComments(nested).size() == 6);
    }

    // ---------- participant templates ----------
    @isTest
    static void testParticipantTemplatesAdmin() {
        bypass();
        System.runAs(u()) {
            Id o = orgId();
            Id tid = tSignDocsController.createTemplate(
                'Doc A', 'Created Template', o, 'https://u/a', '{}');
            Assert.isNotNull(tid);

            Assert.isFalse(tSignDocsController.getTemplates(o).isEmpty());
            Assert.isFalse(tSignDocsController.getTemplatesCT(o).isEmpty());

            tSignDocsController.updateTemplate(tid, 'Doc B', 'Created Template', 'https://u/b', '{"a":1}');
            Assert.isTrue([SELECT Document_Name__c FROM Participant_Template__c WHERE Id = :tid].Document_Name__c == 'Doc B');

            // blank url / json -> not overwritten
            tSignDocsController.updateTemplate(tid, 'Doc C', 'Created Template', '', '');
            Assert.isTrue([SELECT AWS_Document__c FROM Participant_Template__c WHERE Id = :tid].AWS_Document__c == 'https://u/b');

            tSignDocsController.awsupdateTemplate(tid, 'https://u/c', '{"z":1}');
            Assert.isTrue([SELECT AWS_Document__c FROM Participant_Template__c WHERE Id = :tid].AWS_Document__c == 'https://u/c');
        }
    }

    @isTest
    static void testParticipantTemplatesNonAdmin() {
        bypass();
        setUser(null, ORG_NAME);
        System.runAs(u()) {
            Id o = orgId();
            tSignDocsController.createTemplate('Doc N', 'Created Template', o, 'https://u/n', '{}');
            Assert.isFalse(tSignDocsController.getTemplates(o).isEmpty());
            Assert.isFalse(tSignDocsController.getTemplatesCT(o).isEmpty());
        }
    }

    @isTest
    static void testParticipantTemplatesErrors() {
        Integer thrown = 0;
        try { tSignDocsController.getTemplates(null); } catch (AuraHandledException e) { thrown++; }
        try { tSignDocsController.getTemplatesCT(null); } catch (AuraHandledException e) { thrown++; }
        Assert.isTrue(thrown == 2);
    }

    @isTest
    static void testGetAllTemplates() {
        bypass();
        System.runAs(u()) {
            Id o = orgId();
            insert new Template__c(Organisation_Id__c = o, File_Name__c = 'CoverageTest.pdf');
            Assert.isFalse(tSignDocsController.getAllTemplates(o).isEmpty());
            Assert.isTrue(tSignDocsController.getAllTemplates(emptyOrgId()).isEmpty());
        }
    }

    // ---------- quote records ----------
    @isTest
    static void testGetQuoteDocumentRecords() {
        bypass();
        System.runAs(u()) {
            List<Map<String, Object>> rows = tSignDocsController.getQuoteDocumentRecords(String.valueOf(orgId()));
            Assert.isNotNull(rows);

            Boolean thrown = false;
            try {
                tSignDocsController.getQuoteDocumentRecords('');
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
            tSignDocsController.DashboardCounts c = tSignDocsController.getDashboardCounts(String.valueOf(orgId()));
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
            tSignDocsController.DashboardCounts c = tSignDocsController.getDashboardCounts(String.valueOf(emptyOrgId()));
            Assert.isTrue(c.actionRequired == 0);
            Assert.isTrue(c.completed == 0);
        }
        Boolean thrown = false;
        try {
            tSignDocsController.getDashboardCounts(null);
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
            List<tSignDocsController.DashboardRecord> rows =
                tSignDocsController.getDashboardRecords(String.valueOf(orgId()), 'actionRequired');
            Assert.isFalse(rows.isEmpty());

            Boolean found = false;
            for (tSignDocsController.DashboardRecord r : rows) {
                if (r.fileName == 'ActionDoc') {
                    found = true;
                    Assert.isTrue(r.status == 'Pending');
                    Assert.isTrue(r.recipientListDisplay.contains('other@test.com'));
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
            List<tSignDocsController.DashboardRecord> rows =
                tSignDocsController.getDashboardRecords(String.valueOf(orgId()), 'waitingForOthers');
            Assert.isFalse(rows.isEmpty());
        }
    }

    @isTest
    static void testDashboardCompleted() {
        bypass();
        System.runAs(u()) {
            // covers: sig url, multi without sig, single without sig, no children
            List<tSignDocsController.DashboardRecord> rows =
                tSignDocsController.getDashboardRecords(String.valueOf(orgId()), 'completed');
            Assert.isTrue(rows.size() >= 4);
        }
    }

    @isTest
    static void testDashboardExpiringSoon() {
        bypass();
        System.runAs(u()) {
            List<tSignDocsController.DashboardRecord> rows =
                tSignDocsController.getDashboardRecords(String.valueOf(orgId()), 'expiringSoon');
            Assert.isTrue(rows.size() >= 2);

            Boolean high = false;
            Boolean medium = false;
            for (tSignDocsController.DashboardRecord r : rows) {
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
            Assert.isTrue(tSignDocsController.getDashboardRecords(String.valueOf(emptyOrgId()), 'actionRequired').isEmpty());

            Integer thrown = 0;
            try { tSignDocsController.getDashboardRecords('', 'completed'); } catch (AuraHandledException e) { thrown++; }
            try { tSignDocsController.getDashboardRecords(String.valueOf(orgId()), ''); } catch (AuraHandledException e) { thrown++; }
            try { tSignDocsController.getDashboardRecords(String.valueOf(orgId()), 'bogus'); } catch (AuraHandledException e) { thrown++; }
            Assert.isTrue(thrown == 3);
        }
    }

    // ---------- recent activities ----------
    @isTest
    static void testGetRecentActivities() {
        bypass();
        System.runAs(u()) {
            List<tSignDocsController.RecentActivity> acts = tSignDocsController.getRecentActivities(orgId());
            Assert.isFalse(acts.isEmpty());

            Boolean sawAction = false;
            Boolean sawWaiting = false;
            for (tSignDocsController.RecentActivity a : acts) {
                if (a.category == 'Action Required') sawAction = true;
                if (a.category == 'Waiting for Others') sawWaiting = true;
                Assert.isNotNull(a.description);
            }
            Assert.isTrue(sawAction);
            Assert.isTrue(sawWaiting);

            Assert.isTrue(tSignDocsController.getRecentActivities(emptyOrgId()).isEmpty());
        }
    }

    @isTest
    static void testGetRecentActivitiesBlankOrg() {
        Boolean thrown = false;
        try {
            tSignDocsController.getRecentActivities(null);
        } catch (AuraHandledException e) {
            thrown = true;
        }
        Assert.isTrue(thrown);
    }
}