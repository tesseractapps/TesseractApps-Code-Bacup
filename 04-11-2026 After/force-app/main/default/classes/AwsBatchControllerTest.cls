@isTest
public class AwsBatchControllerTest {
    
    // =========================
    // MOCK CLASS
    // =========================
    class MockHttpResponse implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            
            HttpResponse res = new HttpResponse();
            
            // 🔥 STORAGE API
            if (req.getEndpoint().contains('/batch/storage')) {
                res.setStatusCode(200);
                res.setBody('{"grandTotalBytes":1000}');
                return res;
            }
            
            // 🔥 DELETE API
            if (req.getMethod() == 'DELETE') {
                res.setStatusCode(200);
                res.setBody('{"results":[{"status":"ok","key":"file1"}],"total":1,"succeeded":1,"failed":0}');
                return res;
            }
            
            // 🔥 UPLOAD / OVERWRITE API
            res.setStatusCode(200);
            res.setBody(
                '{"results":[{"status":"ok","key":"file1","uploadUrl":"url1","url":"finalUrl","bucket":"b1","env":"dev"}],' +
                '"total":1,"succeeded":1,"failed":0}'
            );
            
            return res;
        }
    }
    
    // =========================
    // TEST METHOD
    // =========================
    @isTest
    static void cover_all_methods() {
        
        Test.setMock(HttpCalloutMock.class, new MockHttpResponse());
        
        // =========================
        // ORG SETUP
        // =========================
        Organisation__c org = new Organisation__c();
        org.Name = 'Ashfield Consultants';
        org.ABN__c = '11234567891';
        org.ACN__c = '878787878';
        org.Contact_No__c = '6132899740';
        org.RCTI__c = 'RCTI1';
        org.Email__c = 'test@gmail.com';
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
        
        // 🔥 REQUIRED FOR YOUR LOGIC
        org.Organization_Tier__c = 'Start';
        org.Storage_Limit__c = 5;
        
        insert org;
        
        // =========================
        // FILE INPUT
        // =========================
        List<Map<String, Object>> files = new List<Map<String, Object>>();
        
        Map<String, Object> f = new Map<String, Object>{
            'key' => org.Id + '/test file (1).pdf',
                'contentType' => 'application/pdf',
                'size' => 100
                };
                    
                    files.add(f);
        
        Test.startTest();
        
        // =========================
        // uploadFiles
        // =========================
        AwsBatchController.uploadFiles(files);
        
        // =========================
        // overwriteFiles
        // =========================
        AwsBatchController.overwriteFiles(files);
        
        // =========================
        // deleteFiles
        // =========================
        AwsBatchController.deleteFiles(new List<String>{ org.Id + '/test.pdf' });
        
        // =========================
        // deleteFilesFromAwsJson
        // =========================
        String awsJson =
        '{' +
        '"attachments":[' +
        '{' +
        '"files":[' +
        '{"key":"' + org.Id + '/docs/test1.pdf"},' +
        '{"key":"' + org.Id + '/docs/test2.pdf"}' +
        ']' +
        '}' +
        ']' +
        '}';
        
        AwsBatchController.ApiResponse response =
            AwsBatchController.deleteFilesFromAwsJson(awsJson);
        
        System.assertNotEquals(null, response);
        
        AwsBatchController.sanitizeFullPath('application/pdf');
        
        // =========================
        // EMPTY INPUT EXCEPTION (batch)
        // =========================
        try {
            AwsBatchController.uploadFiles(new List<Map<String, Object>>());
        } catch (Exception e) {}
        
        // =========================
        // EMPTY INPUT EXCEPTION (delete)
        // =========================
        try {
            AwsBatchController.deleteFiles(new List<String>());
        } catch (Exception e) {}
        
        // =========================
        // INVALID KEYS (delete)
        // =========================
        try {
            AwsBatchController.deleteFiles(new List<String>{ '', null });
        } catch (Exception e) {}
        
        // =========================
        // HELPER METHODS COVER
        // =========================
        
        // extractFormat
        /*AwsBatchController.extractFormat('file.pdf', 'application/pdf');
        AwsBatchController.extractFormat('file', 'image/png');
        AwsBatchController.extractFormat(null, null);
        
        // sanitizeFullPath
        AwsBatchController.sanitizeFullPath('org/test file (1).pdf');
        AwsBatchController.sanitizeFullPath(null);*/
        
        // getUploadConfig (exception path)
        try {
            AwsBatchController.getUploadConfig('INVALID_MODULE');
        } catch (Exception e) {}
        
        Test.stopTest();
    }
   
}