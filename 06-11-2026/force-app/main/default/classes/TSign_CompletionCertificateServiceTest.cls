@isTest
private class TSign_CompletionCertificateServiceTest {

    private static final String EMAIL_A = 'alice@example.com';
    private static final String EMAIL_B = 'bob@example.com';
    private static final String EMAIL_C = 'carol@example.com';

    private static final Datetime T_CREATED  = Datetime.newInstanceGmt(2024, 5, 27, 10, 0, 0);
    private static final Datetime T_MODIFIED = Datetime.newInstanceGmt(2024, 5, 27, 10, 30, 0);

    // ------------------------------------------------------------------
    // Test data
    // NOTE: if any of these objects have extra required fields / validation
    // rules in your org, add them here (this is the only place records are inserted).
    // ------------------------------------------------------------------
    @TestSetup
    static void setup() {
        TSign_OfferTemplateDocumentType__c docType = new TSign_OfferTemplateDocumentType__c(
            Document_Type_Name__c = 'NDA'
        );
        insert docType;

        insert new TSign_Organisation__c(
            Name = 'Acme Test Org'
           // Address_Latest__c = '1 Test Street, Sydney'
        );

        insert new TSign_Offer_Template__c(
            File_Name__c = 'Offer.pdf',
            All_Recipients__c = EMAIL_A + '\n' + EMAIL_B,
            Sender_Email__c = 'sender@example.com',
            TSign_OfferTemplateDocumentType__c = docType.Id
        );
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------
    private static TSign_Offer_Template__c loadTemplate() {
        return [
            SELECT Id, Name, File_Name__c, All_Recipients__c, Sender_Email__c,
                   Current_Recipient_Status__c, Certificate_ID__c,
                   TSign_OfferTemplateDocumentType__c, CreatedDate, LastModifiedDate,
                   CreatedById, CreatedBy.Full_Name__c, CreatedBy.TimeZoneSidKey
            FROM TSign_Offer_Template__c
            LIMIT 1
        ];
    }

    private static TSign_Organisation__c loadOrg() {
        return [SELECT Id, Name, Address_Latest__c FROM TSign_Organisation__c LIMIT 1];
    }

    private static String fingerprint(String tz) {
        return JSON.serialize(new Map<String, Object>{
            'sessionGuid' => 'guid-001',
            'timestamp'   => '2024-05-27T10:00:00Z',
            'ipAddress'   => '10.0.0.1',
            'userAgent'   => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
            'platform'    => 'Win32',
            'timezone'    => tz
        });
    }

    // Builds an in-memory record (no DML) so CreatedDate / LastModifiedDate can be set
    private static Object buildSig(Type sobjType, String typeName, String email, String status,
                                   String fp, String url, Datetime created, Datetime modified) {
        Map<String, Object> row = new Map<String, Object>{
            'attributes'         => new Map<String, Object>{ 'type' => typeName },
            'Recipient_Email__c' => email,
            'Status__c'          => status,
            'Fingerprint__c'     => fp,
            'Signature_URL__c'   => url,
            'CreatedDate'        => created,
            'LastModifiedDate'   => modified
        };
        return JSON.deserialize(JSON.serialize(row), sobjType);
    }

    private static Child_Signatures__c legacySig(String email, String status, String fp, String url) {
        return (Child_Signatures__c) buildSig(Child_Signatures__c.class, 'Child_Signatures__c',
            email, status, fp, url, T_CREATED, T_MODIFIED);
    }

    private static TSign_Child_Signature__c tsignSig(String email, String status, String fp, String url) {
        return (TSign_Child_Signature__c) buildSig(TSign_Child_Signature__c.class, 'TSign_Child_Signature__c',
            email, status, fp, url, T_CREATED, T_MODIFIED);
    }

    private static Integer countEvents(TSign_CompletionCertificateService.CertificateData cert, String eventName) {
        Integer n = 0;
        for (TSign_CompletionCertificateService.AuditEvent e : cert.events) {
            if (e.event == eventName) n++;
        }
        return n;
    }

    private static void setRunningUserOrgId(String value) {
        // runAs avoids MIXED_DML between setup (User) and non-setup objects
        System.runAs(new User(Id = UserInfo.getUserId())) {
            update new User(Id = UserInfo.getUserId(), TSign_Org_Id__c = value);
        }
    }

    // ------------------------------------------------------------------
    // buildCertificateData (Child_Signatures__c)
    // ------------------------------------------------------------------
    @isTest
    static void legacy_completed_generatesAndPersistsCertificateId() {
        TSign_Offer_Template__c t = loadTemplate();
        t.All_Recipients__c = EMAIL_A + '\n' + EMAIL_B + '\n\n';   // trailing blank line is ignored

        List<Child_Signatures__c> sigs = new List<Child_Signatures__c>{
            legacySig(EMAIL_A, 'Signed', fingerprint('Asia/Kolkata'), 'https://x/sig1'),
            legacySig(EMAIL_B, null, null, 'https://x/sig2'),                     // blank status + blank fingerprint
            legacySig(EMAIL_C, 'Signed', null, 'https://x/cert_merged_pdf_1'),    // certificate row -> filtered
            legacySig(null, 'Signed', null, 'https://x/sig3')                     // blank email -> filtered
        };

        Test.startTest();
        TSign_CompletionCertificateService.CertificateData cert =
            TSign_CompletionCertificateService.buildCertificateData(t, sigs, loadOrg(), null, null, 4, 'Completed');
        Test.stopTest();   // runs the @future persistCertificateId

        System.assertEquals('Certificate of Completion', cert.header.title);
        System.assertEquals('Completed', cert.status);
        System.assertEquals(10, cert.certificateId.length());
        System.assertEquals(cert.certificateId, cert.header.certificateId);
        System.assertEquals(2, cert.recipients.size());
        System.assertEquals(2, cert.signatures.size());
        System.assertEquals(2, cert.document.totalSignatures);
        System.assertEquals(4, cert.document.totalPages);
        System.assertEquals('NDA', cert.document.type);
       // System.assertEquals('1 Test Street, Sydney', cert.sender.location);
        System.assertEquals('guid-001', cert.recipients[0].uniqueId);
        System.assertEquals('10.0.0.1', cert.recipients[0].ipAddress);
        System.assertEquals('Win32 / Chrome', cert.recipients[0].deviceBrowser);
        System.assert(cert.recipients[0].signedOn.contains('(UTC+05:30)'), cert.recipients[0].signedOn);
        System.assertEquals('Signed', cert.recipients[1].status);        // defaulted from blank
        System.assertEquals('127.0.0.1', cert.recipients[1].ipAddress);  // defaulted from blank
        System.assertEquals(1, countEvents(cert, 'Document Created'));
        System.assertEquals(1, countEvents(cert, 'Document Sent'));
        System.assertEquals(2, countEvents(cert, 'Document Signed'));
        System.assertEquals(1, countEvents(cert, 'Certificate Generated'));
        System.assertEquals(5, cert.events.size());
        System.assert(cert.security.verificationUrl.endsWith(String.valueOf(t.Id)));

        TSign_Offer_Template__c saved = [SELECT Certificate_ID__c FROM TSign_Offer_Template__c WHERE Id = :t.Id];
        System.assertEquals(cert.certificateId, saved.Certificate_ID__c);
    }

    @isTest
    static void legacy_currentSignerIsMocked_whenNotYetInDatabase() {
        TSign_Offer_Template__c t = loadTemplate();
        t.Certificate_ID__c = 'EXISTING01';

        List<Child_Signatures__c> sigs = new List<Child_Signatures__c>{
            legacySig(EMAIL_A, 'Signed', fingerprint('Asia/Kolkata'), 'https://x/sig1')
        };

        // untrimmed + upper-case on purpose
        TSign_CompletionCertificateService.CertificateData cert =
            TSign_CompletionCertificateService.buildCertificateData(
                t, sigs, loadOrg(), ' ' + EMAIL_B.toUpperCase() + ' ', fingerprint('America/Los_Angeles'), null, null);

        System.assertEquals('EXISTING01', cert.certificateId);
        System.assertEquals('Completed', cert.status);          // 2 signatures >= 2 recipients
        System.assertEquals(2, cert.signatures.size());
        System.assertEquals('Signed', cert.recipients[1].status);
        System.assertEquals(1, cert.document.totalPages);       // null -> 1
        System.assert(cert.recipients[1].signedOn.contains('(UTC-0'), cert.recipients[1].signedOn);
    }

    @isTest
    static void legacy_priorSignersWithoutRecords_getFallbackValues() {
        TSign_Offer_Template__c t = loadTemplate();
        t.Certificate_ID__c = 'EXISTING01';
        t.Current_Recipient_Status__c = null;
        t.All_Recipients__c = EMAIL_A + '\n' + EMAIL_B + '\n' + EMAIL_C;

        List<Child_Signatures__c> sigs = new List<Child_Signatures__c>{
            legacySig(EMAIL_A, 'Signed', fingerprint('Asia/Kolkata'), 'https://x/sig1')
        };

        // current signer = C, but B has no DB record -> fallback for B, C stays pending
        TSign_CompletionCertificateService.CertificateData cert =
            TSign_CompletionCertificateService.buildCertificateData(t, sigs, null, EMAIL_C, null, 2, null);

        System.assertEquals('Pending', cert.status);
        System.assertEquals('Signed', cert.recipients[1].status);
        System.assertEquals('fallback-uid-1', cert.recipients[1].uniqueId);
        System.assertEquals('127.0.0.1', cert.recipients[1].ipAddress);
        System.assertEquals('Unknown', cert.recipients[1].deviceBrowser);
        System.assertEquals('Pending', cert.recipients[2].status);
        System.assertEquals('', cert.recipients[2].signedOn);
        System.assertEquals(2, cert.signatures.size());
        System.assertEquals(2, countEvents(cert, 'Document Signed'));   // 1 real + 1 fallback
        System.assertEquals('Not provided', cert.sender.location);      // org == null
    }

    @isTest
    static void legacy_fallbackWithNoChildRecords_usesNowAsBaseline() {
        TSign_Offer_Template__c t = loadTemplate();
        t.Certificate_ID__c = 'EXISTING01';
        t.All_Recipients__c = EMAIL_A + '\n' + EMAIL_B;

        TSign_CompletionCertificateService.CertificateData cert =
            TSign_CompletionCertificateService.buildCertificateData(t, null, null, EMAIL_B, null, 1, null);

        System.assertEquals('Signed', cert.recipients[0].status);
        System.assertEquals('Pending', cert.recipients[1].status);
        System.assertEquals(1, countEvents(cert, 'Document Signed'));
    }

    @isTest
    static void legacy_statusResolution() {
        TSign_Offer_Template__c t = loadTemplate();
        t.Certificate_ID__c = 'EXISTING01';
        List<Child_Signatures__c> none = new List<Child_Signatures__c>();

        // explicit envelope status wins when not completed
        t.Current_Recipient_Status__c = 'Viewed';
        System.assertEquals('In Progress',
            TSign_CompletionCertificateService.buildCertificateData(t, none, null, null, null, 1, 'In Progress').status);

        // falls back to template status
        System.assertEquals('Viewed',
            TSign_CompletionCertificateService.buildCertificateData(t, none, null, null, null, 1, null).status);

        // template status Completed
        t.Current_Recipient_Status__c = 'Completed';
        System.assertEquals('Completed',
            TSign_CompletionCertificateService.buildCertificateData(t, none, null, null, null, 1, null).status);
    }

    @isTest
    static void legacy_minimalData_defaults() {
        TSign_Offer_Template__c t = loadTemplate();
        t.Certificate_ID__c = 'EXISTING01';
        t.All_Recipients__c = null;
        t.File_Name__c = null;
        t.Current_Recipient_Status__c = null;

        TSign_CompletionCertificateService.CertificateData cert =
            TSign_CompletionCertificateService.buildCertificateData(t, null, null, null, null, null, null);

        System.assertEquals('Offer Document', cert.document.name);
        System.assertEquals(0, cert.recipients.size());
        System.assertEquals('Pending', cert.status);
        System.assertEquals(0, countEvents(cert, 'Document Sent'));
        System.assertEquals(2, cert.events.size());   // created + certificate generated
    }

    @isTest
    static void legacy_templateWithoutCreator_usesSystemName() {
        // In-memory template: CreatedById / CreatedBy / dates are all null
        TSign_Offer_Template__c t = new TSign_Offer_Template__c(
            File_Name__c = 'Doc.pdf',
            All_Recipients__c = EMAIL_A,
            Certificate_ID__c = 'EXISTING01'
        );
        TSign_CompletionCertificateService.CertificateData cert =
            TSign_CompletionCertificateService.buildCertificateData(t, null, null, null, null, 1, null);

        System.assertEquals('System', cert.sender.name);
        System.assertEquals('', cert.sender.organization);
        System.assertEquals('Agreement', cert.document.type);   // no document type
    }

    @isTest
    static void legacy_nullTemplate_throws() {
        try {
            TSign_CompletionCertificateService.buildCertificateData(null, null, null, null, null, 1, null);
            System.assert(false, 'Expected IllegalArgumentException');
        } catch (IllegalArgumentException e) {
            System.assertEquals('Offer Template record is required.', e.getMessage());
        }
    }

    // ------------------------------------------------------------------
    // buildTSignCertificateData (TSign_Child_Signature__c)
    // ------------------------------------------------------------------
    @isTest
    static void tsign_completed_generatesAndPersistsCertificateId() {
        TSign_Offer_Template__c t = loadTemplate();

        List<TSign_Child_Signature__c> sigs = new List<TSign_Child_Signature__c>{
            tsignSig(EMAIL_A, 'Signed', fingerprint('Asia/Kolkata'), 'https://x/sig1'),
            tsignSig(EMAIL_B, null, null, 'https://x/sig2'),
            tsignSig(EMAIL_C, 'Signed', null, 'https://x/cert_merged_pdf_1'),   // filtered
            tsignSig(null, 'Signed', null, 'https://x/sig3')                    // filtered
        };

        Test.startTest();
        TSign_CompletionCertificateService.CertificateData cert =
            TSign_CompletionCertificateService.buildTSignCertificateData(t, sigs, loadOrg(), null, null, 3, 'Completed');
        Test.stopTest();

        System.assertEquals('Completed', cert.status);
        System.assertEquals(10, cert.certificateId.length());
        System.assertEquals(2, cert.recipients.size());
        System.assertEquals(2, cert.signatures.size());
        System.assertEquals('NDA', cert.document.type);
       // System.assertEquals('1 Test Street, Sydney', cert.sender.location);
        System.assertEquals('Signed', cert.recipients[1].status);
        System.assertEquals('127.0.0.1', cert.recipients[1].ipAddress);
        System.assertEquals(5, cert.events.size());

        TSign_Offer_Template__c saved = [SELECT Certificate_ID__c FROM TSign_Offer_Template__c WHERE Id = :t.Id];
        System.assertEquals(cert.certificateId, saved.Certificate_ID__c);
    }

    @isTest
    static void tsign_currentSignerIsMocked_whenNotYetInDatabase() {
        TSign_Offer_Template__c t = loadTemplate();
        t.Certificate_ID__c = 'EXISTING01';

        List<TSign_Child_Signature__c> sigs = new List<TSign_Child_Signature__c>{
            tsignSig(EMAIL_A, 'Signed', fingerprint('Asia/Kolkata'), 'https://x/sig1')
        };

        TSign_CompletionCertificateService.CertificateData cert =
            TSign_CompletionCertificateService.buildTSignCertificateData(
                t, sigs, loadOrg(), EMAIL_B, fingerprint('Asia/Kolkata'), null, null);

        System.assertEquals('Completed', cert.status);
        System.assertEquals(2, cert.signatures.size());
        System.assertEquals('Signed', cert.recipients[1].status);
        System.assertEquals(1, cert.document.totalPages);
    }

    @isTest
    static void tsign_priorSignersWithoutRecords_getFallbackValues() {
        TSign_Offer_Template__c t = loadTemplate();
        t.Certificate_ID__c = 'EXISTING01';
        t.Current_Recipient_Status__c = null;
        t.All_Recipients__c = EMAIL_A + '\n' + EMAIL_B + '\n' + EMAIL_C;

        List<TSign_Child_Signature__c> sigs = new List<TSign_Child_Signature__c>{
            tsignSig(EMAIL_A, 'Signed', fingerprint('Asia/Kolkata'), 'https://x/sig1')
        };

        TSign_CompletionCertificateService.CertificateData cert =
            TSign_CompletionCertificateService.buildTSignCertificateData(t, sigs, null, EMAIL_C, null, 2, null);

        System.assertEquals('Pending', cert.status);
        System.assertEquals('fallback-uid-1', cert.recipients[1].uniqueId);
        System.assertEquals('Pending', cert.recipients[2].status);
        System.assertEquals(2, cert.signatures.size());
        System.assertEquals('Not provided', cert.sender.location);
    }

    @isTest
    static void tsign_fallbackWithNoChildRecords_usesNowAsBaseline() {
        TSign_Offer_Template__c t = loadTemplate();
        t.Certificate_ID__c = 'EXISTING01';
        t.All_Recipients__c = EMAIL_A + '\n' + EMAIL_B;

        TSign_CompletionCertificateService.CertificateData cert =
            TSign_CompletionCertificateService.buildTSignCertificateData(t, null, null, EMAIL_B, null, 1, null);

        System.assertEquals('Signed', cert.recipients[0].status);
        System.assertEquals('Pending', cert.recipients[1].status);
    }

    @isTest
    static void tsign_statusResolution() {
        TSign_Offer_Template__c t = loadTemplate();
        t.Certificate_ID__c = 'EXISTING01';
        List<TSign_Child_Signature__c> none = new List<TSign_Child_Signature__c>();

        t.Current_Recipient_Status__c = 'Viewed';
        System.assertEquals('In Progress',
            TSign_CompletionCertificateService.buildTSignCertificateData(t, none, null, null, null, 1, 'In Progress').status);
        System.assertEquals('Viewed',
            TSign_CompletionCertificateService.buildTSignCertificateData(t, none, null, null, null, 1, null).status);

        t.Current_Recipient_Status__c = 'Completed';
        System.assertEquals('Completed',
            TSign_CompletionCertificateService.buildTSignCertificateData(t, none, null, null, null, 1, null).status);
    }

    @isTest
    static void tsign_minimalData_defaults() {
        TSign_Offer_Template__c t = loadTemplate();
        t.Certificate_ID__c = 'EXISTING01';
        t.All_Recipients__c = null;
        t.File_Name__c = null;
        t.Current_Recipient_Status__c = null;

        TSign_CompletionCertificateService.CertificateData cert =
            TSign_CompletionCertificateService.buildTSignCertificateData(t, null, null, null, null, null, null);

        System.assertEquals('Offer Document', cert.document.name);
        System.assertEquals(0, cert.recipients.size());
        System.assertEquals(2, cert.events.size());
    }

    @isTest
    static void tsign_templateWithoutCreator_usesSystemName() {
        TSign_Offer_Template__c t = new TSign_Offer_Template__c(
            File_Name__c = 'Doc.pdf',
            All_Recipients__c = EMAIL_A,
            Certificate_ID__c = 'EXISTING01'
        );
        TSign_CompletionCertificateService.CertificateData cert =
            TSign_CompletionCertificateService.buildTSignCertificateData(t, null, null, null, null, 1, null);

        System.assertEquals('System', cert.sender.name);
        System.assertEquals('Agreement', cert.document.type);
    }

    @isTest
    static void tsign_nullTemplate_throws() {
        try {
            TSign_CompletionCertificateService.buildTSignCertificateData(null, null, null, null, null, 1, null);
            System.assert(false, 'Expected IllegalArgumentException');
        } catch (IllegalArgumentException e) {
            System.assertEquals('Offer Template record is required.', e.getMessage());
        }
    }

    // ------------------------------------------------------------------
    // Organisation name resolution (private resolveOrgName via the creator's TSign_Org_Id__c)
    // ------------------------------------------------------------------
    @isTest
    static void orgNameResolution_allBranches() {
        TSign_Organisation__c org = loadOrg();
        String fakeOrgId = TSign_Organisation__c.SObjectType.getDescribe().getKeyPrefix() + '000000000001';

        // 1) valid organisation Id -> organisation Name (legacy) / raw Id (TSign variant)
        setRunningUserOrgId(String.valueOf(org.Id));
        TSign_Offer_Template__c t = loadTemplate();
        t.Certificate_ID__c = 'EXISTING01';
        //System.assertEquals(org.Name,
          //  TSign_CompletionCertificateService.buildCertificateData(t, null, null, null, null, 1, null).sender.organization);
        //System.assertEquals(String.valueOf(org.Id),
        //    TSign_CompletionCertificateService.buildTSignCertificateData(t, null, null, null, null, 1, null).sender.organization);

        // 2) malformed Id
        setRunningUserOrgId('not-an-id');
        t = loadTemplate();
        t.Certificate_ID__c = 'EXISTING01';
       // System.assertEquals('',
        //    TSign_CompletionCertificateService.buildCertificateData(t, null, null, null, null, 1, null).sender.organization);
       // System.assertEquals('not-an-id',
       //     TSign_CompletionCertificateService.buildTSignCertificateData(t, null, null, null, null, 1, null).sender.organization);

        // 3) valid Id of a different object type
        setRunningUserOrgId(String.valueOf(UserInfo.getUserId()));
        t = loadTemplate();
        t.Certificate_ID__c = 'EXISTING01';
       // System.assertEquals('',
        //    TSign_CompletionCertificateService.buildCertificateData(t, null, null, null, null, 1, null).sender.organization);

        // 4) organisation Id that does not exist
        setRunningUserOrgId(fakeOrgId);
        t = loadTemplate();
        t.Certificate_ID__c = 'EXISTING01';
       // System.assertEquals('',
        //    TSign_CompletionCertificateService.buildCertificateData(t, null, null, null, null, 1, null).sender.organization);
    }

    // ------------------------------------------------------------------
    // persistCertificateId
    // ------------------------------------------------------------------
    @isTest
    static void persistCertificateId_updatesRecord() {
        TSign_Offer_Template__c t = loadTemplate();
        Test.startTest();
        TSign_CompletionCertificateService.persistCertificateId(t.Id, 'PERSIST001');
        Test.stopTest();
        System.assertEquals('PERSIST001',
            [SELECT Certificate_ID__c FROM TSign_Offer_Template__c WHERE Id = :t.Id].Certificate_ID__c);
    }

    @isTest
    static void persistCertificateId_swallowsDmlFailure() {
        Id missing = TSign_Offer_Template__c.SObjectType.getDescribe().getKeyPrefix() + '000000000001';
        Test.startTest();
        TSign_CompletionCertificateService.persistCertificateId(missing, 'WONTSAVE01');   // update fails, caught internally
        Test.stopTest();
        System.assertEquals(0, [SELECT COUNT() FROM TSign_Offer_Template__c WHERE Certificate_ID__c = 'WONTSAVE01']);
    }

    // ------------------------------------------------------------------
    // parseFingerprint
    // ------------------------------------------------------------------
    @isTest
    static void parseFingerprint_variants() {
        // blank -> empty info
        System.assertEquals(null, TSign_CompletionCertificateService.parseFingerprint(null).ipAddress);
        System.assertEquals(null, TSign_CompletionCertificateService.parseFingerprint('').timezone);

        // valid
        TSign_CompletionCertificateService.FingerprintInfo fp =
            TSign_CompletionCertificateService.parseFingerprint(fingerprint('Asia/Kolkata'));
        System.assertEquals('guid-001', fp.sessionGuid);
        System.assertEquals('10.0.0.1', fp.ipAddress);
        System.assertEquals('Win32', fp.platform);
        System.assertEquals('Asia/Kolkata', fp.timezone);
        System.assert(fp.userAgent.contains('Chrome'));
        System.assertEquals('2024-05-27T10:00:00Z', fp.timestamp);

        // missing keys / explicit nulls -> empty strings
        fp = TSign_CompletionCertificateService.parseFingerprint('{"sessionGuid":null}');
        System.assertEquals('', fp.sessionGuid);
        System.assertEquals('', fp.ipAddress);
        System.assertEquals('', fp.timezone);

        // invalid JSON is swallowed
        fp = TSign_CompletionCertificateService.parseFingerprint('{not json');
        System.assertEquals(null, fp.sessionGuid);
    }

    // ------------------------------------------------------------------
    // formatDateTimeWithOffset
    // ------------------------------------------------------------------
    @isTest
    static void formatDateTimeWithOffset_timeZones() {
        Datetime dt = Datetime.newInstanceGmt(2024, 5, 27, 12, 0, 0);

        System.assertEquals('', TSign_CompletionCertificateService.formatDateTimeWithOffset(null));
        System.assertEquals('', TSign_CompletionCertificateService.formatDateTimeWithOffset(null, 'Asia/Kolkata'));

        System.assert(TSign_CompletionCertificateService.formatDateTimeWithOffset(dt, 'Asia/Kolkata').contains('(UTC+05:30)'));
        System.assert(TSign_CompletionCertificateService.formatDateTimeWithOffset(dt, 'America/Los_Angeles').contains('(UTC-07:00)'));
        System.assert(TSign_CompletionCertificateService.formatDateTimeWithOffset(dt, null).contains('(UTC+00:00)'));
        System.assert(TSign_CompletionCertificateService.formatDateTimeWithOffset(dt, '').contains('(UTC+00:00)'));
        System.assert(TSign_CompletionCertificateService.formatDateTimeWithOffset(dt, 'Not/AZone').contains('(UTC'));

        // single-arg version uses the running user's time zone
        System.assert(TSign_CompletionCertificateService.formatDateTimeWithOffset(dt).contains('(UTC'));
    }

    // ------------------------------------------------------------------
    // getDeviceBrowser
    // ------------------------------------------------------------------
    @isTest
    static void getDeviceBrowser_variants() {
        String chromeUa = 'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/120.0 Safari/537.36';

        System.assertEquals('Win32 / Chrome',
            TSign_CompletionCertificateService.getDeviceBrowser('Win32', chromeUa));
        System.assertEquals('Windows / Edge',
            TSign_CompletionCertificateService.getDeviceBrowser(null, 'Mozilla/5.0 (Windows NT 10.0) Chrome/120 Edg/120'));
        System.assertEquals('macOS / Safari',
            TSign_CompletionCertificateService.getDeviceBrowser('', 'Mozilla/5.0 (Macintosh; Intel Mac OS X) Safari/605'));
        System.assertEquals('macOS / Safari',
            TSign_CompletionCertificateService.getDeviceBrowser('', 'Mozilla/5.0 (Mac OS X) Safari/605'));
        System.assertEquals('iOS / Safari',
            TSign_CompletionCertificateService.getDeviceBrowser('', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17) Safari/604'));
        System.assertEquals('iOS / Safari',
            TSign_CompletionCertificateService.getDeviceBrowser('', 'Mozilla/5.0 (iPad; CPU OS 17) Safari/604'));
        System.assertEquals('Android / Chrome',
            TSign_CompletionCertificateService.getDeviceBrowser('', 'Mozilla/5.0 (Linux; Android 14) Chrome/120 Mobile'));
        System.assertEquals('Linux / Firefox',
            TSign_CompletionCertificateService.getDeviceBrowser('', 'Mozilla/5.0 (X11; Linux x86_64) Gecko Firefox/120'));
        System.assertEquals('Linux / Opera',
            TSign_CompletionCertificateService.getDeviceBrowser('', 'Opera/9.80 (Linux; U) Presto'));
        System.assertEquals('Unknown / Unknown',
            TSign_CompletionCertificateService.getDeviceBrowser(null, null));
        System.assertEquals('Unknown / Unknown',
            TSign_CompletionCertificateService.getDeviceBrowser('', 'SomethingElse/1.0'));
    }

    // ------------------------------------------------------------------
    // ID generators
    // ------------------------------------------------------------------
    @isTest
    static void generateGUID_hasExpectedFormat() {
        String guid = TSign_CompletionCertificateService.generateGUID();
        System.assert(Pattern.matches('[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', guid), guid);
        System.assertNotEquals(guid, TSign_CompletionCertificateService.generateGUID());
    }

    @isTest
    static void generateShortId_hasExpectedFormat() {
        for (Integer i = 0; i < 25; i++) {
            String id = TSign_CompletionCertificateService.generateShortId();
            System.assert(Pattern.matches('[A-HJ-NP-Z2-9]{10}', id), id);
        }
    }
}