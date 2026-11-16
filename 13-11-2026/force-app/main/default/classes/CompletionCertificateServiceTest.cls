@isTest
private class CompletionCertificateServiceTest {

    private class OkMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setHeader('Content-Type', 'application/json');
            res.setBody('{"status":"success"}');
            return res;
        }
    }

    private static final String RECIPIENTS = 'one@test.com\ntwo@test.com\nthree@test.com';

    private static final String FP_JSON = '{"sessionGuid":"guid-1","timestamp":"2024-05-27T10:00:00Z",'
        + '"ipAddress":"10.0.0.1","userAgent":"Mozilla/5.0 (Windows NT 10.0) Chrome/120 Safari/537",'
        + '"platform":"Win32","timezone":"Asia/Kolkata"}';

    @TestSetup
    static void setup() {
        Test.setMock(HttpCalloutMock.class, new OkMock());
        Test.startTest();

        // ----- TSign objects -----
        TSign_Organisation__c org = new TSign_Organisation__c(Name = 'Test Org');
        insert org;

        TSign_Offer_Template__c tt = new TSign_Offer_Template__c(
            File_Name__c = 'test.pdf',
            TSign_Organisation__c = org.Id,
            All_Recipients__c = RECIPIENTS,
            Sender_Email__c = 'sender@test.com'
        );
        insert tt;

        insert new List<TSign_Child_Signature__c>{
            new TSign_Child_Signature__c(
                TSign_Offer_Template__c = tt.Id,
                Recipient_Email__c = 'one@test.com',
                Fingerprint__c = FP_JSON,
                Signature_URL__c = 'https://x.com/sig1.png'
            ),
            // certificate row -> filtered out
            new TSign_Child_Signature__c(
                TSign_Offer_Template__c = tt.Id,
                Recipient_Email__c = 'cert@test.com',
                Signature_URL__c = 'https://x.com/cert_merged_pdf.pdf'
            ),
            // blank email -> filtered out
            new TSign_Child_Signature__c(
                TSign_Offer_Template__c = tt.Id,
                Signature_URL__c = 'https://x.com/blank.png'
            )
        };

        // ----- legacy objects -----
        Offer_Template__c ot = new Offer_Template__c(
            File_Name__c = 'legacy.pdf',
            All_Recipients__c = RECIPIENTS,
            Sender_Email__c = 'sender@test.com'
        );
        insert ot;

        insert new List<Child_Signatures__c>{
            new Child_Signatures__c(
                Offer_Template__c = ot.Id,
                Recipient_Email__c = 'one@test.com',
                Fingerprint__c = FP_JSON,
                Signature_URL__c = 'https://x.com/sig1.png'
            ),
            new Child_Signatures__c(
                Offer_Template__c = ot.Id,
                Recipient_Email__c = 'cert@test.com',
                Signature_URL__c = 'https://x.com/cert_merged_pdf.pdf'
            ),
            new Child_Signatures__c(
                Offer_Template__c = ot.Id,
                Signature_URL__c = 'https://x.com/blank.png'
            )
        };

        Test.stopTest();
    }

    // ---------- query helpers ----------
    private static TSign_Offer_Template__c tTemplate() {
        return [
            SELECT Id, Name, File_Name__c, All_Recipients__c, Current_Recipient_Status__c,
                   Certificate_ID__c, Sender_Email__c, CreatedDate, LastModifiedDate, CreatedById,
                   CreatedBy.TimeZoneSidKey, CreatedBy.Full_Name__c, CreatedBy.Organization_Name__c,
                   TSign_OfferTemplateDocumentType__c
            FROM TSign_Offer_Template__c LIMIT 1
        ];
    }

    private static List<TSign_Child_Signature__c> tChildren(Id tId) {
        return [
            SELECT Id, Name, Recipient_Email__c, Status__c, Fingerprint__c,
                   CreatedDate, LastModifiedDate, Signature_URL__c
            FROM TSign_Child_Signature__c
            WHERE TSign_Offer_Template__c = :tId
            ORDER BY CreatedDate ASC
        ];
    }

    private static Offer_Template__c oTemplate() {
        return [
            SELECT Id, Name, File_Name__c, All_Recipients__c, Current_Recipient_Status__c,
                   Certificate_ID__c, Sender_Email__c, CreatedDate, LastModifiedDate, CreatedById,
                   CreatedBy.TimeZoneSidKey, CreatedBy.Full_Name__c, CreatedBy.Organization_Name__c,
                   OfferTemplateDocumentType__c
            FROM Offer_Template__c LIMIT 1
        ];
    }

    private static List<Child_Signatures__c> oChildren(Id oId) {
        return [
            SELECT Id, Name, Recipient_Email__c, Status__c, Fingerprint__c,
                   CreatedDate, LastModifiedDate, Signature_URL__c
            FROM Child_Signatures__c
            WHERE Offer_Template__c = :oId
            ORDER BY CreatedDate ASC
        ];
    }

    // ---------- parseFingerprint ----------
    @isTest
    static void testParseFingerprint() {
        CompletionCertificateService.FingerprintInfo blank = CompletionCertificateService.parseFingerprint(null);
        Assert.isNull(blank.sessionGuid);

        CompletionCertificateService.FingerprintInfo ok = CompletionCertificateService.parseFingerprint(FP_JSON);
        Assert.isTrue(ok.sessionGuid == 'guid-1');
        Assert.isTrue(ok.ipAddress == '10.0.0.1');
        Assert.isTrue(ok.timezone == 'Asia/Kolkata');
        Assert.isTrue(ok.platform == 'Win32');

        // missing keys + null values
        CompletionCertificateService.FingerprintInfo part =
            CompletionCertificateService.parseFingerprint('{"sessionGuid":null,"ipAddress":"1.1.1.1"}');
        Assert.isTrue(part.sessionGuid == '');
        Assert.isTrue(part.ipAddress == '1.1.1.1');
        Assert.isTrue(part.timezone == '');

        // bad JSON -> caught
        CompletionCertificateService.FingerprintInfo bad = CompletionCertificateService.parseFingerprint('not json');
        Assert.isNull(bad.sessionGuid);
    }

    // ---------- formatDateTimeWithOffset ----------
    @isTest
    static void testFormatDateTimeSingleArg() {
        Assert.isTrue(CompletionCertificateService.formatDateTimeWithOffset(null) == '');
        String s = CompletionCertificateService.formatDateTimeWithOffset(Datetime.now());
        Assert.isTrue(s.contains('(UTC'));
    }

    @isTest
    static void testFormatDateTimeWithZone() {
        Datetime dt = Datetime.newInstanceGmt(2024, 5, 27, 12, 0, 0);

        Assert.isTrue(CompletionCertificateService.formatDateTimeWithOffset(null, 'GMT') == '');
        Assert.isTrue(CompletionCertificateService.formatDateTimeWithOffset(dt, null).contains('(UTC+00:00)'));
        Assert.isTrue(CompletionCertificateService.formatDateTimeWithOffset(dt, '').contains('(UTC+00:00)'));
        Assert.isTrue(CompletionCertificateService.formatDateTimeWithOffset(dt, 'Asia/Kolkata').contains('(UTC+05:30)'));
        Assert.isTrue(CompletionCertificateService.formatDateTimeWithOffset(dt, 'America/New_York').contains('(UTC-04:00)'));
        // unknown id falls back to GMT
        Assert.isTrue(CompletionCertificateService.formatDateTimeWithOffset(dt, 'Not/AZone').contains('(UTC'));
    }

    // ---------- getDeviceBrowser ----------
    @isTest
    static void testGetDeviceBrowser() {
        Assert.isTrue(CompletionCertificateService.getDeviceBrowser(null, null) == 'Unknown / Unknown');
        Assert.isTrue(CompletionCertificateService.getDeviceBrowser('Win32', 'Chrome/120').contains('Win32 / Chrome'));

        // OS from user agent
        Assert.isTrue(CompletionCertificateService.getDeviceBrowser(null, 'Windows NT Edg/120').contains('Windows / Edge'));
        Assert.isTrue(CompletionCertificateService.getDeviceBrowser(null, 'Macintosh Safari/600').contains('macOS / Safari'));
        Assert.isTrue(CompletionCertificateService.getDeviceBrowser(null, 'Mac OS X Firefox/100').contains('macOS / Firefox'));
        Assert.isTrue(CompletionCertificateService.getDeviceBrowser(null, 'iPhone Safari/600').contains('iOS / Safari'));
        Assert.isTrue(CompletionCertificateService.getDeviceBrowser(null, 'iPad Safari/600').contains('iOS'));
        Assert.isTrue(CompletionCertificateService.getDeviceBrowser(null, 'Android Chrome/100').contains('Android / Chrome'));
        Assert.isTrue(CompletionCertificateService.getDeviceBrowser(null, 'Linux Firefox/100').contains('Linux / Firefox'));
        Assert.isTrue(CompletionCertificateService.getDeviceBrowser(null, 'Linux OPR/90').contains('Opera'));
        Assert.isTrue(CompletionCertificateService.getDeviceBrowser(null, 'Linux Opera/90').contains('Opera'));
        Assert.isTrue(CompletionCertificateService.getDeviceBrowser(null, 'SomethingElse').contains('Unknown / Unknown'));
    }

    // ---------- id generators ----------
    @isTest
    static void testGenerators() {
        String g = CompletionCertificateService.generateGUID();
        Assert.isTrue(g.length() == 36);
        Assert.isTrue(g.countMatches('-') == 4);

        String s = CompletionCertificateService.generateShortId();
        Assert.isTrue(s.length() == 10);
        Assert.isFalse(s.contains('O') || s.contains('0') || s.contains('I') || s.contains('1'));
    }

    // ---------- AuditEvent.compareTo ----------
    @isTest
    static void testAuditEventCompare() {
        CompletionCertificateService.AuditEvent a = new CompletionCertificateService.AuditEvent();
        CompletionCertificateService.AuditEvent b = new CompletionCertificateService.AuditEvent();

        // nulls
        Assert.isTrue(a.compareTo(b) == 0);

        a.eventDateTime = Datetime.now();
        b.eventDateTime = a.eventDateTime;
        Assert.isTrue(a.compareTo(b) == 0);

        b.eventDateTime = a.eventDateTime.addMinutes(5);
        Assert.isTrue(a.compareTo(b) == -1);
        Assert.isTrue(b.compareTo(a) == 1);
    }

    // ---------- buildTSignCertificateData ----------
    @isTest
    static void testTSignNullTemplate() {
        Boolean thrown = false;
        try {
            CompletionCertificateService.buildTSignCertificateData(null, null, null, null, null, null, null);
        } catch (IllegalArgumentException e) {
            thrown = true;
        }
        Assert.isTrue(thrown);
    }

    @isTest
    static void testTSignCurrentSignerMock() {
        TSign_Offer_Template__c t = tTemplate();
        List<TSign_Child_Signature__c> kids = tChildren(t.Id);
        kids[0].Status__c = 'Signed';
        t.Current_Recipient_Status__c = 'Pending';
        t.Certificate_ID__c = null;

        TSign_Organisation__c org = new TSign_Organisation__c(Name = 'Org');

        Test.setMock(HttpCalloutMock.class, new OkMock());
        Test.startTest();
        CompletionCertificateService.CertificateData cert =
            CompletionCertificateService.buildTSignCertificateData(
                t, kids, org, 'two@test.com', FP_JSON, 4, 'In Progress');
        Test.stopTest();

        Assert.isNotNull(cert);
        Assert.isTrue(cert.recipients.size() == 3);
        Assert.isTrue(cert.certificateId.length() == 10);
        Assert.isTrue(cert.status == 'In Progress');
        Assert.isTrue(cert.document.totalPages == 4);
        // one real + one mocked current signer
        Assert.isTrue(cert.signatures.size() == 2);
        Assert.isTrue(cert.recipients[2].status == 'Pending');
        Assert.isFalse(cert.events.isEmpty());
        Assert.isNotNull(cert.security.verificationUrl);
    }

    @isTest
    static void testTSignFallbackPriorSigner() {
        TSign_Offer_Template__c t = tTemplate();
        List<TSign_Child_Signature__c> kids = tChildren(t.Id);
        t.Certificate_ID__c = 'EXISTING12';
        t.Current_Recipient_Status__c = 'Pending';
        t.File_Name__c = null; // default file name branch

        // current = third, only first has DB record -> second is fallback
        CompletionCertificateService.CertificateData cert =
            CompletionCertificateService.buildTSignCertificateData(
                t, kids, null, 'three@test.com', null, null, null);

        Assert.isTrue(cert.certificateId == 'EXISTING12');
        Assert.isTrue(cert.document.name == 'Offer Document');
        Assert.isTrue(cert.document.totalPages == 1);
        Assert.isTrue(cert.sender.location == 'Not provided');
        Assert.isTrue(cert.recipients[1].uniqueId == 'fallback-uid-1');
        Assert.isTrue(cert.recipients[1].status == 'Signed');
        Assert.isTrue(cert.status == 'Pending');
    }

    @isTest
    static void testTSignCompletedAndStatusBranches() {
        TSign_Offer_Template__c t = tTemplate();
        t.Certificate_ID__c = 'EXISTING12';
        List<TSign_Child_Signature__c> kids = tChildren(t.Id);

        // envelope status completed
        Assert.isTrue(CompletionCertificateService.buildTSignCertificateData(
            t, kids, null, null, null, 1, 'Completed').status == 'Completed');

        // template status completed
        t.Current_Recipient_Status__c = 'Completed';
        Assert.isTrue(CompletionCertificateService.buildTSignCertificateData(
            t, kids, null, null, null, 1, null).status == 'Completed');

        // blank envelope, template status used
        t.Current_Recipient_Status__c = 'Pending';
        Assert.isTrue(CompletionCertificateService.buildTSignCertificateData(
            t, kids, null, null, null, 1, null).status == 'Pending');

        // null child list, no recipients
        t.All_Recipients__c = null;
        CompletionCertificateService.CertificateData empty =
            CompletionCertificateService.buildTSignCertificateData(t, null, null, null, null, 1, null);
        Assert.isTrue(empty.recipients.isEmpty());
        Assert.isTrue(empty.signatures.isEmpty());
    }

    @isTest
    static void testTSignDocTypeAndCreator() {
        TSign_Offer_Template__c t = tTemplate();
        t.Certificate_ID__c = 'EXISTING12';
        // fake doc type id -> query runs, returns empty
        t.TSign_OfferTemplateDocumentType__c =
            Id.valueOf(TSign_OfferTemplateDocumentType__c.SObjectType.getDescribe().getKeyPrefix() + '000000000001');

        CompletionCertificateService.CertificateData cert =
            CompletionCertificateService.buildTSignCertificateData(
                t, tChildren(t.Id), null, null, null, 1, null);
        Assert.isTrue(cert.document.type == 'Agreement');
    }

    // ---------- buildCertificateData (legacy objects) ----------
    @isTest
    static void testLegacyNullTemplate() {
        Boolean thrown = false;
        try {
            CompletionCertificateService.buildCertificateData(null, null, null, null, null, null, null);
        } catch (IllegalArgumentException e) {
            thrown = true;
        }
        Assert.isTrue(thrown);
    }

    @isTest
    static void testLegacyCurrentSignerMock() {
        Offer_Template__c t = oTemplate();
        List<Child_Signatures__c> kids = oChildren(t.Id);
        kids[0].Status__c = 'Signed';
        t.Current_Recipient_Status__c = 'Pending';
        t.Certificate_ID__c = null;

        Organisation__c org = new Organisation__c(Name = 'Org');

        Test.setMock(HttpCalloutMock.class, new OkMock());
        Test.startTest();
        CompletionCertificateService.CertificateData cert =
            CompletionCertificateService.buildCertificateData(
                t, kids, org, 'two@test.com', FP_JSON, 2, 'In Progress');
        Test.stopTest();

        Assert.isNotNull(cert);
        Assert.isTrue(cert.recipients.size() == 3);
        Assert.isTrue(cert.certificateId.length() == 10);
        Assert.isTrue(cert.signatures.size() == 2);
        Assert.isFalse(cert.events.isEmpty());
    }

    @isTest
    static void testLegacyFallbackAndNoOrg() {
        Offer_Template__c t = oTemplate();
        t.Certificate_ID__c = 'EXISTING12';
        t.Current_Recipient_Status__c = 'Pending';
        t.File_Name__c = null;
        t.OfferTemplateDocumentType__c =
            Id.valueOf(OfferTemplateDocumentType__c.SObjectType.getDescribe().getKeyPrefix() + '000000000001');

        CompletionCertificateService.CertificateData cert =
            CompletionCertificateService.buildCertificateData(
                t, oChildren(t.Id), null, 'three@test.com', null, null, null);

        Assert.isTrue(cert.document.name == 'Offer Document');
        Assert.isTrue(cert.sender.location == 'Not provided');
        Assert.isTrue(cert.recipients[1].uniqueId == 'fallback-uid-1');
    }

    @isTest
    static void testLegacyStatusBranches() {
        Offer_Template__c t = oTemplate();
        t.Certificate_ID__c = 'EXISTING12';
        List<Child_Signatures__c> kids = oChildren(t.Id);

        Assert.isTrue(CompletionCertificateService.buildCertificateData(
            t, kids, null, null, null, 1, 'Completed').status == 'Completed');

        t.Current_Recipient_Status__c = 'Completed';
        Assert.isTrue(CompletionCertificateService.buildCertificateData(
            t, kids, null, null, null, 1, null).status == 'Completed');

        t.Current_Recipient_Status__c = 'Pending';
        Assert.isTrue(CompletionCertificateService.buildCertificateData(
            t, kids, null, null, null, 1, null).status == 'Pending');

        t.All_Recipients__c = null;
        Assert.isTrue(CompletionCertificateService.buildCertificateData(
            t, null, null, null, null, 1, null).recipients.isEmpty());
    }

    // ---------- future method ----------
    @isTest
    static void testPersistCertificateId() {
        Offer_Template__c t = oTemplate();
        Test.startTest();
        CompletionCertificateService.persistCertificateId(t.Id, 'PERSIST123');
        // bad id -> caught inside
        CompletionCertificateService.persistCertificateId(
            Id.valueOf(Offer_Template__c.SObjectType.getDescribe().getKeyPrefix() + '000000000001'), 'X');
        Test.stopTest();
    }
}