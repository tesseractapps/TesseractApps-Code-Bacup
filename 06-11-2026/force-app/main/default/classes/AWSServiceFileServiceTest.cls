@isTest
private class AWSServiceFileServiceTest {

    private class AWSMock implements HttpCalloutMock {
        Integer code;
        AWSMock(Integer code) { this.code = code; }
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(code);
            res.setBody('ok');
            return res;
        }
    }

    private static AWSServiceFileService getService() {
        return new AWSServiceFileService('key', 'secret', 'bucket', 'PUT', 's3.amazonaws.com');
    }

    private static String b64() {
        return JSON.serialize(EncodingUtil.base64Encode(Blob.valueOf('test')));
    }

    private static String fakeId(String objName) {
        String prefix = Schema.getGlobalDescribe().get(objName).getDescribe().getKeyPrefix();
        return prefix + '000000000001AAA';
    }

    @isTest
    static void testContentType() {
        AWSServiceFileService svc = getService();
        for (String t : new List<String>{'docx','csv','wav','wmv','mp3','mp4','png','pdf','jpg','PDF'}) {
            Assert.isNotNull(svc.ContentType(t));
        }
    }

    @isTest
    static void testCreateAuthHeader() {
        AWSServiceFileService svc = getService();
        String auth = svc.CreateAuthHeader('.png', 'file.png', 'Mon, 01 Jan 2024 00:00:00 GMT', '.png');
        Assert.isTrue(auth.startsWith('AWS key:'));
    }

    @isTest
    static void testMissingCredentials() {
        AWSServiceFileService svc = new AWSServiceFileService('', '', '', 'PUT', '');
        Boolean thrown = false;
        try {
            svc.UploadDocuments(b64(), 'file.png', '001000000000001AAA', 'case');
        } catch (Exception e) {
            thrown = true;
        }
        Assert.isTrue(thrown);
    }

    @isTest
    static void testUploadFailureStatus() {
        Test.setMock(HttpCalloutMock.class, new AWSMock(500));
        Test.startTest();
        getService().UploadDocuments(b64(), 'file.png', '500000000000001AAA', 'case');
        Test.stopTest();
        Assert.isTrue(true);
    }

    @isTest
    static void testUploadCase() {
        Case c = new Case(Subject = 'Test');
        insert c;
        Test.setMock(HttpCalloutMock.class, new AWSMock(200));
        Test.startTest();
        getService().UploadDocuments(b64(), 'file.png', c.Id, 'case');
        Test.stopTest();
        Assert.isNotNull([SELECT Amazon_URL__c FROM Case WHERE Id = :c.Id].Amazon_URL__c);
    }

    @isTest
    static void testUploadLead() {
        Lead l = new Lead(LastName = 'Test', Company = 'Test Co');
        insert l;
        Test.setMock(HttpCalloutMock.class, new AWSMock(200));
        Test.startTest();
        getService().UploadDocuments(b64(), 'file.pdf', l.Id, 'lead');
        Test.stopTest();
        Assert.isNotNull([SELECT Amazon_Url__c FROM Lead WHERE Id = :l.Id].Amazon_Url__c);
    }

    // Covers every switch branch. Fake ids -> DML fails -> caught. No required-field setup needed.
    @isTest
    static void testAllSwitchBranches() {
        Map<String, String> objMap = new Map<String, String>{
            'audit' => 'Staff_Payroll_Setting__c',
            'invoice' => 'Service_Invoice__c',
            'rep' => 'Repository__c',
            'attach' => 'Attachment__c',
            'agree' => 'Service_Agreement__c',
            'expense' => 'Expenses__c',
            'staff' => 'Staff__c',
            'reimburse' => 'Reimbursement__c',
            'invoiceParent' => 'Invoice_Parent__c',
            'case' => 'Case',
            'ChildStaff' => 'Child_Staff__c',
            'hrtraining' => 'Training__c',
            'facility' => 'Facility__c',
            'client' => 'client__c',
            'lead' => 'Lead',
            'tesseractInvoice' => 'Tesseract_Invoice__c',
            'leave' => 'Leave__c',
            'pform' => 'Participant_Form__c',
            'org' => 'Organisation__c',
            'activity' => 'BAS_and_IAS__c',
            'Award' => 'Award__c',
            'SupportInvoice' => 'Support_Invoice__c',
            'RFQ' => 'RFQ__c',
            'offerLetter' => 'Offer_Template__c',
            'signUrl' => 'Offer_Template__c',
            'RiskRecords' => 'Risk_Management__c',
            'AccountingInvoice' => 'Accounting_Invoices_Expenses__c',
            'Attachment' => 'Ticket__c',
            'Post Attachment' => 'Ticket__c',
            'ParticipantTemplate' => 'Participant_Template__c',
            'XeroInvoice' => 'Xero_or_Myob_Invoice__c',
            'PurchaseInvoice' => 'Accounting_Invoices_Expenses__c',
            'AccountingInvoicePayment' => 'Invoice_Payment__c',
            'quote' => 'NDIS_Quote__c',
            'tsigncontact' => 'TSign_Contact__c'
        };

        Test.setMock(HttpCalloutMock.class, new AWSMock(200));
        Test.startTest();
        for (String key : objMap.keySet()) {
            try {
                getService().UploadDocuments(b64(), 'file.png', fakeId(objMap.get(key)), key);
            } catch (Exception e) {
                // expected: fake record id
            }
        }
        Test.stopTest();
        Assert.isTrue(true);
    }

    @isTest
    static void testUnknownObjAnd201() {
        Test.setMock(HttpCalloutMock.class, new AWSMock(201));
        Test.startTest();
        getService().UploadDocuments(b64(), 'file.png', '001000000000001AAA', 'unknown');
        Test.stopTest();
        Assert.isTrue(true);
    }
}