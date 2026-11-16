public without sharing class tSignDocApiController {

    // ===== RESPONSE WRAPPER =====
    public class ApiResult {
        @AuraEnabled public Integer statusCode;
        @AuraEnabled public String  body;       // raw JSON from the API
        @AuraEnabled public String  endpoint;   // path only, e.g. /tsign/pages
        @AuraEnabled public String  error;      // null on success
    }

    // ===== PUBLIC METHODS =====

    @AuraEnabled
    public static Map<String, Object> getUploadConfig(String moduleName) {
        System.debug('🔹 [DOC-API] Fetching upload config for module: ' + moduleName);

        List<AWS_File_Upload_Config__mdt> configList = [
            SELECT Base_Path__c,
                   Allowed_Formats__c,
                   Max_File_Size__c,
                   File_Size_Unit__c,
                   Is_Unlimited__c,
                   Allow_Multiple__c,
                   Multiple_Count__c,
                   Show_UI__c
            FROM AWS_File_Upload_Config__mdt
            WHERE Module_Name__c = :moduleName
            LIMIT 1
        ];

        if (configList.isEmpty()) {
            System.debug('❌ [DOC-API] No config found for module: ' + moduleName);
            throw new AuraHandledException('Upload configuration not found for module: ' + moduleName);
        }

        AWS_File_Upload_Config__mdt config = configList[0];

        Long maxSizeBytes;
        if (config.Is_Unlimited__c) {
            maxSizeBytes = null;
        } else if (config.Max_File_Size__c != null) {
            if (config.File_Size_Unit__c == 'GB') {
                maxSizeBytes = (Long)(config.Max_File_Size__c * 1024 * 1024 * 1024);
            } else if (config.File_Size_Unit__c == 'MB') {
                maxSizeBytes = (Long)(config.Max_File_Size__c * 1024 * 1024);
            } else if (config.File_Size_Unit__c == 'KB') {
                maxSizeBytes = (Long)(config.Max_File_Size__c * 1024);
            } else {
                maxSizeBytes = (Long)(config.Max_File_Size__c * 1024 * 1024);
            }
        } else {
            maxSizeBytes = null;
        }

        return new Map<String, Object>{
            'basePathTemplate' => config.Base_Path__c,
            'formats' => config.Allowed_Formats__c,
            'maxSizeBytes' => maxSizeBytes,
            'allowMultiple' => config.Allow_Multiple__c,
            'maxFileCount' => config.Multiple_Count__c,
            'isUnlimited' => config.Is_Unlimited__c,
            'showUI' => config.Show_UI__c
        };
    }

    @AuraEnabled
    public static ApiResult uploadFiles(List<Map<String, Object>> files) {
        if (files == null || files.isEmpty()) {
            throw new AuraHandledException('Files list cannot be empty');
        }

        List<Object> fileList = new List<Object>();
        for (Map<String, Object> f : files) {
            String key = (String) f.get('key');
            String contentType = (String) f.get('contentType');

            Map<String, Object> fileMap = new Map<String, Object>{
                'key' => key,
                'contentType' => contentType,
                'format' => extractFormat(key, contentType)
            };

            if (f.containsKey('convert')) {
                Object convVal = f.get('convert');
                if (convVal instanceof Boolean) {
                    fileMap.put('convert', (Boolean) convVal);
                } else if (convVal instanceof String) {
                    String strVal = ((String) convVal).toLowerCase().trim();
                    if (strVal == 'true') {
                        fileMap.put('convert', true);
                    } else if (strVal == 'false') {
                        fileMap.put('convert', false);
                    } else {
                        throw new AuraHandledException('Invalid convert flag: ' + strVal);
                    }
                } else {
                    throw new AuraHandledException('Invalid convert flag type');
                }
            }

            fileList.add(fileMap);
        }

        Map<String, Object> payload = new Map<String, Object>{
            'defaults' => new Map<String, String>{
                'env' => getEnvironment()
            },
            'files' => fileList
        };

        return executeCallout('POST', '/tsign/upload', JSON.serialize(payload));
    }

    @AuraEnabled
    public static ApiResult convertFile(String key) {
        if (String.isBlank(key)) {
            throw new AuraHandledException('File key cannot be blank');
        }

        Map<String, Object> payload = new Map<String, Object>{
            'defaults' => new Map<String, String>{
                'env' => getEnvironment()
            },
            'files' => new List<Object>{
                new Map<String, Object>{ 'key' => key.trim() }
            }
        };

        return executeCallout('POST', '/tsign/convert', JSON.serialize(payload));
    }

    @AuraEnabled
    public static ApiResult getPages(String keyOrUrl) {
        if (String.isBlank(keyOrUrl)) {
            throw new AuraHandledException('Key or URL cannot be blank');
        }

        String trimmed = keyOrUrl.trim();
        Map<String, Object> fileMap = new Map<String, Object>();
        if (trimmed.startsWithIgnoreCase('http')) {
            fileMap.put('fullUrl', trimmed);
        } else {
            fileMap.put('key', trimmed);
        }

        Map<String, Object> payload = new Map<String, Object>{
            'defaults' => new Map<String, String>{
                'env' => getEnvironment()
            },
            'files' => new List<Object>{ fileMap }
        };

        return executeCallout('POST', '/tsign/pages', JSON.serialize(payload));
    }

    @AuraEnabled
    public static ApiResult getPagesForSigner(Id recordId, String linkToken, Boolean useChildPdf) {
        String pdfUrl = resolvePdfUrl(recordId, linkToken, useChildPdf);
        return getPages(pdfUrl);
    }

    @AuraEnabled
    public static ApiResult getPdfDownloadForSigner(Id recordId, String linkToken, Boolean useChildPdf) {
        String pdfUrl = resolvePdfUrl(recordId, linkToken, useChildPdf);
        return getDownloadUrl(pdfUrl);
    }

    @AuraEnabled
    public static ApiResult getPagesForRecord(Id recordId) {
        String pdfUrl = resolvePdfUrl(recordId, null, false);
        return getPages(pdfUrl);
    }

    @AuraEnabled
    public static ApiResult getPdfDownloadForRecord(Id recordId) {
        String pdfUrl = resolvePdfUrl(recordId, null, false);
        return getDownloadUrl(pdfUrl);
    }

    @AuraEnabled
    public static ApiResult getDownloadUrl(String keyOrUrl) {
        if (String.isBlank(keyOrUrl)) {
            throw new AuraHandledException('Key or URL cannot be blank');
        }

        String trimmed = keyOrUrl.trim();
        Map<String, Object> fileMap = new Map<String, Object>();
        if (trimmed.startsWithIgnoreCase('http')) {
            fileMap.put('fullUrl', trimmed);
        } else {
            fileMap.put('key', trimmed);
        }

        Map<String, Object> payload = new Map<String, Object>{
            'defaults' => new Map<String, String>{
                'env' => getEnvironment()
            },
            'files' => new List<Object>{ fileMap }
        };

        return executeCallout('POST', '/tsign/download', JSON.serialize(payload));
    }

    @AuraEnabled
    public static ApiResult getDownloadUrlVariant(String keyOrUrl, String variant, String fileName) {
        if (UserInfo.getUserType() == 'Guest') {
            throw new AuraHandledException('Not allowed');
        }

        if (String.isBlank(keyOrUrl)) {
            throw new AuraHandledException('Key or URL cannot be blank');
        }

        String normalizedVariant = String.isBlank(variant) ? 'document' : variant.trim().toLowerCase();
        Set<String> validVariants = new Set<String>{ 'document', 'certificate', 'combined' };
        if (!validVariants.contains(normalizedVariant)) {
            throw new AuraHandledException('Invalid variant: ' + variant);
        }

        String trimmed = keyOrUrl.trim();
        Map<String, Object> fileMap = new Map<String, Object>();
        if (trimmed.startsWithIgnoreCase('http')) {
            fileMap.put('fullUrl', trimmed.substringBefore('?'));
        } else {
            fileMap.put('key', trimmed);
        }
        fileMap.put('variant', normalizedVariant);

        if (String.isNotBlank(fileName)) {
            String sanitized = fileName.replaceAll('[^A-Za-z0-9 ._-]', '').trim();
            if (sanitized.length() > 150) {
                sanitized = sanitized.substring(0, 150).trim();
            }
            if (String.isNotBlank(sanitized)) {
                fileMap.put('fileName', sanitized);
            }
        }

        Map<String, Object> payload = new Map<String, Object>{
            'defaults' => new Map<String, String>{
                'env' => getEnvironment()
            },
            'files' => new List<Object>{ fileMap }
        };

        return executeCallout('POST', '/tsign/download', JSON.serialize(payload));
    }

    @AuraEnabled
    public static ApiResult getOverwriteUrl(String keyOrUrl) {
        if (String.isBlank(keyOrUrl)) {
            throw new AuraHandledException('Key or URL cannot be blank');
        }

        String trimmed = keyOrUrl.trim();
        Map<String, Object> fileMap = new Map<String, Object>();
        if (trimmed.startsWithIgnoreCase('http')) {
            fileMap.put('fullUrl', trimmed);
        } else {
            fileMap.put('key', trimmed);
        }

        Map<String, Object> payload = new Map<String, Object>{
            'defaults' => new Map<String, String>{
                'env' => getEnvironment()
            },
            'files' => new List<Object>{ fileMap }
        };

        return executeCallout('POST', '/tsign/overwrite', JSON.serialize(payload));
    }

    @AuraEnabled
    public static ApiResult deleteFiles(List<String> keys) {
        if (keys == null || keys.isEmpty()) {
            throw new AuraHandledException('Keys list cannot be empty');
        }

        List<String> validKeys = new List<String>();
        for (String k : keys) {
            if (String.isNotBlank(k)) {
                validKeys.add(k.trim());
            }
        }

        if (validKeys.isEmpty()) {
            throw new AuraHandledException('No valid file keys provided to delete');
        }

        Map<String, Object> payload = new Map<String, Object>{
            'env' => getEnvironment(),
            'keys' => validKeys
        };

        return executeCallout('DELETE', '/tsign/delete', JSON.serialize(payload));
    }

    @AuraEnabled
    public static ApiResult getStampAssetUploadUrls(Id recordId, String linkToken, Boolean useChildPdf, String requestId, List<String> fieldIds) {
        String src = resolvePdfUrl(recordId, linkToken, useChildPdf);
        if (String.isBlank(src)) {
            throw new AuraHandledException('Source PDF URL cannot be resolved');
        }

        Pattern reqIdPattern = Pattern.compile('^[0-9a-fA-F-]{36}$');
        if (String.isBlank(requestId) || !reqIdPattern.matcher(requestId.trim()).matches()) {
            throw new AuraHandledException('Invalid requestId: ' + requestId);
        }

        if (fieldIds == null || fieldIds.isEmpty() || fieldIds.size() > 50) {
            throw new AuraHandledException('fieldIds must contain between 1 and 50 entries');
        }

        Pattern fieldIdPattern = Pattern.compile('^[A-Za-z0-9_-]{1,80}$');
        for (String fId : fieldIds) {
            if (String.isBlank(fId) || !fieldIdPattern.matcher(fId.trim()).matches()) {
                throw new AuraHandledException('Invalid fieldId: ' + fId);
            }
        }

        String srcKey = keyFromUrl(src);
        String tenant = tenantOf(srcKey);

        List<Object> fileList = new List<Object>();
        for (String fId : fieldIds) {
            String assetKey = tenant + '/stamp-assets/' + requestId.trim() + '/' + fId.trim() + '.png';
            fileList.add(new Map<String, Object>{
                'key' => assetKey,
                'contentType' => 'image/png'
            });
        }

        Map<String, Object> payload = new Map<String, Object>{
            'defaults' => new Map<String, String>{
                'env' => getEnvironment()
            },
            'files' => fileList
        };

        return executeCallout('POST', '/tsign/upload', JSON.serialize(payload));
    }

    @AuraEnabled
    public static ApiResult stampForSigner(Id recordId, String linkToken, Boolean useChildPdf, String requestId, String fieldsJson, String certificateJson, String fileName) {
        String src = resolvePdfUrl(recordId, linkToken, useChildPdf);
        String srcKey = keyFromUrl(src);
        String tenant = tenantOf(srcKey);

        Pattern reqIdPattern = Pattern.compile('^[0-9a-fA-F-]{36}$');
        if (String.isBlank(requestId) || !reqIdPattern.matcher(requestId.trim()).matches()) {
            throw new AuraHandledException('Invalid requestId: ' + requestId);
        }

        if (String.isBlank(fieldsJson)) {
            throw new AuraHandledException('fieldsJson cannot be blank');
        }

        List<Object> fields;
        try {
            fields = (List<Object>) JSON.deserializeUntyped(fieldsJson);
        } catch (Exception e) {
            throw new AuraHandledException('Invalid fieldsJson: ' + e.getMessage());
        }

        if (fields == null || fields.isEmpty() || fields.size() > 500) {
            throw new AuraHandledException('fields must contain between 1 and 500 entries');
        }

        String expectedPrefix = tenant + '/stamp-assets/' + requestId.trim() + '/';
        for (Object obj : fields) {
            if (obj instanceof Map<String, Object>) {
                Map<String, Object> fMap = (Map<String, Object>) obj;
                if (fMap.containsKey('imageKey') && fMap.get('imageKey') != null) {
                    String imageKey = String.valueOf(fMap.get('imageKey'));
                    if (!imageKey.startsWith(expectedPrefix)) {
                        throw new AuraHandledException('Invalid asset key: ' + imageKey);
                    }
                }
            }
        }

        Object certObj;
        if (String.isBlank(certificateJson)) {
            certObj = new Map<String, Object>{ 'append' => false };
        } else {
            try {
                certObj = JSON.deserializeUntyped(certificateJson);
            } catch (Exception e) {
                throw new AuraHandledException('Invalid certificateJson: ' + e.getMessage());
            }
        }

        // Never log fieldsJson/certificateJson (they contain PII). Log requestId, field count, srcKey only.
        System.debug('[DOC-API] stampForSigner requestId: ' + requestId + ', field count: ' + fields.size() + ', srcKey: ' + srcKey);

        Map<String, Object> sourceMap = new Map<String, Object>{
            'fullUrl' => src.contains('?') ? src.substringBefore('?') : src
        };

        Map<String, Object> outputMap = new Map<String, Object>{
            'fileName' => String.isNotBlank(fileName) ? fileName.trim() : 'Signed_Document.pdf'
        };

        Map<String, Object> body = new Map<String, Object>{
            'defaults' => new Map<String, String>{ 'env' => getEnvironment() },
            'requestId' => requestId.trim(),
            'source' => sourceMap,
            'output' => outputMap,
            'fields' => fields,
            'certificate' => certObj,
            'wait' => 20,
            'linkSeconds' => 600,
            'warmPages' => true
        };

        return executeCallout('POST', '/tstamp/stamp', JSON.serialize(body));
    }

    // ===== PRIVATE HELPERS =====

    private static String keyFromUrl(String urlOrKey) {
        if (String.isBlank(urlOrKey)) {
            return '';
        }
        String trimmed = urlOrKey.trim();
        if (trimmed.startsWithIgnoreCase('http://') || trimmed.startsWithIgnoreCase('https://')) {
            String cleanUrl = trimmed.contains('?') ? trimmed.substringBefore('?') : trimmed;
            String path;
            try {
                System.Url u = new System.Url(cleanUrl);
                path = u.getPath();
            } catch (Exception ex) {
                String afterProtocol = cleanUrl.substringAfter('://');
                path = afterProtocol.contains('/') ? ('/' + afterProtocol.substringAfter('/')) : '';
            }
            if (String.isNotBlank(path)) {
                while (path.startsWith('/')) {
                    path = path.substring(1);
                }
                try {
                    return EncodingUtil.urlDecode(path, 'UTF-8');
                } catch (Exception ex) {
                    return path;
                }
            }
            return '';
        }
        return trimmed;
    }

    private static String tenantOf(String key) {
        if (String.isBlank(key) || !key.contains('/')) {
            throw new AuraHandledException('Tenant cannot be determined from key: ' + key);
        }
        String tenant = key.substringBefore('/');
        if (String.isBlank(tenant)) {
            throw new AuraHandledException('Tenant is blank in key: ' + key);
        }
        return tenant;
    }

    /**
     * Inner without sharing class to guarantee query access in system mode after link token
     * or record validation, ensuring Experience Cloud guest users can resolve template and
     * child signature PDFs.
     */
    private without sharing class PdfUrlResolver {
        public String getTemplatePdfUrl(Id recordId) {
            String url;
            try {
                // Call public static method directly
                url = TSignTemplateController.getUploadedFileUrl(String.valueOf(recordId));
            } catch (Exception ex) {
                System.debug('[DOC-API] TSignTemplateController.getUploadedFileUrl exception: ' + ex.getMessage());
            }

            // Fallback: exact query as in TSignTemplateController.getUploadedFileUrl
            if (String.isBlank(url)) {
                List<TSign_Offer_Template__c> records = [
                    SELECT Amazon_Url__c
                    FROM TSign_Offer_Template__c
                    WHERE Id = :recordId
                    LIMIT 1
                ];
                if (!records.isEmpty()) {
                    url = records[0].Amazon_Url__c;
                }
            }
            return url;
        }

        public String getChildPdfUrl(Id recordId, String currentUserEmail) {
            String url;
            if (String.isNotBlank(currentUserEmail)) {
                try {
                    // Call public static method directly
                    TSign_Child_Signature__c child = TSignTemplateController.getChildSignatureDetails(String.valueOf(recordId), currentUserEmail);
                    if (child != null && String.isNotBlank(child.Signature_URL__c)) {
                        url = child.Signature_URL__c;
                    }
                } catch (Exception ex) {
                    System.debug('[DOC-API] TSignTemplateController.getChildSignatureDetails exception: ' + ex.getMessage());
                }
            }

            // Fallback: exact query as in TSignTemplateController.getChildSignatureDetails
            if (String.isBlank(url)) {
                List<TSign_Child_Signature__c> childRecords = [
                    SELECT Name, Signature_URL__c, Expire__c, Link_Active__c, TSign_Offer_Template__c, Recipient_Email__c
                    FROM TSign_Child_Signature__c
                    WHERE TSign_Offer_Template__c = :recordId
                    ORDER BY CreatedDate DESC
                ];
                if (String.isNotBlank(currentUserEmail)) {
                    for (TSign_Child_Signature__c record : childRecords) {
                        if (record.Recipient_Email__c == currentUserEmail && String.isNotBlank(record.Signature_URL__c)) {
                            url = record.Signature_URL__c;
                            break;
                        }
                    }
                }
                if (String.isBlank(url) && !childRecords.isEmpty()) {
                    url = childRecords[0].Signature_URL__c;
                }
            }
            return url;
        }
    }

    /**
     * Shared helper to resolve PDF URL for signers and internal record view.
     * Validates link token if provided; otherwise validates recordId.
     */
    private static String resolvePdfUrl(Id recordId, String linkToken, Boolean useChildPdf) {
        PdfUrlResolver resolver = new PdfUrlResolver();
        String pdfUrl;

        if (String.isNotBlank(linkToken)) {
            // Signer link flow: validate token first
            Map<String, Object> linkInfo = TSignTemplateController.resolveSignerLink(linkToken.trim());
            if (linkInfo == null || (Boolean) linkInfo.get('found') != true) {
                throw new AuraHandledException('Invalid signer link token; userType=' + UserInfo.getUserType());
            }

            if ((Boolean) linkInfo.get('isExpired') == true) {
                throw new AuraHandledException('Signer link has expired; recordId=' + linkInfo.get('recordId') + '; userType=' + UserInfo.getUserType());
            }

            if ((Boolean) linkInfo.get('isActive') != true) {
                throw new AuraHandledException('Signer link is no longer active; recordId=' + linkInfo.get('recordId') + '; userType=' + UserInfo.getUserType());
            }

            Id resolvedRecordId = (Id) linkInfo.get('recordId');
            if (resolvedRecordId == null) {
                throw new AuraHandledException('Signer link is not associated with a record; userType=' + UserInfo.getUserType());
            }

            if (recordId != null && recordId != resolvedRecordId) {
                throw new AuraHandledException('Signer link does not match record; recordId=' + recordId + '; resolvedRecordId=' + resolvedRecordId + '; userType=' + UserInfo.getUserType());
            }

            if (useChildPdf == true) {
                String recipientEmail = (String) linkInfo.get('email');
                pdfUrl = resolver.getChildPdfUrl(resolvedRecordId, recipientEmail);
                if (String.isBlank(pdfUrl)) {
                    throw new AuraHandledException(
                        'No signed child PDF found for recordId=' + resolvedRecordId +
                        '; query/field=Signature_URL__c; userType=' + UserInfo.getUserType()
                    );
                }
            } else {
                pdfUrl = resolver.getTemplatePdfUrl(resolvedRecordId);
                if (String.isBlank(pdfUrl)) {
                    throw new AuraHandledException(
                        'No template PDF found for recordId=' + resolvedRecordId +
                        '; query/field=Amazon_Url__c; userType=' + UserInfo.getUserType()
                    );
                }
            }
        } else {
            // Record / Internal view flow
            if (recordId == null) {
                throw new AuraHandledException('Record ID cannot be blank; userType=' + UserInfo.getUserType());
            }

            pdfUrl = resolver.getTemplatePdfUrl(recordId);
            if (String.isBlank(pdfUrl)) {
                throw new AuraHandledException(
                    'No template PDF found for recordId=' + recordId +
                    '; query/field=Amazon_Url__c; userType=' + UserInfo.getUserType()
                );
            }
        }

        return pdfUrl;
    }

    private static String resolvePdfUrlForSigner(Id recordId, String linkToken, Boolean useChildPdf) {
        return resolvePdfUrl(recordId, linkToken, useChildPdf);
    }

    private static String resolvePdfUrlForRecord(Id recordId) {
        return resolvePdfUrl(recordId, null, false);
    }

    private static ApiResult executeCallout(String method, String path, String body) {
        ApiResult result = new ApiResult();
        result.endpoint = path;

        String apiKey = getApiKey();
        if (String.isBlank(apiKey)) {
            result.error = 'TsignApp_API_Key label is not configured';
            return result;
        }

        HttpRequest req = buildRequest(method, path, body, apiKey);
        if (path == '/tstamp/stamp') {
            System.debug('[DOC-API] ' + method + ' ' + path + ' payload: (redacted for PII)');
        } else {
            System.debug('[DOC-API] ' + method + ' ' + path + ' payload: ' + redactUrls(body));
        }

        try {
            HttpResponse res = new Http().send(req);
            result.statusCode = res.getStatusCode();
            String resBody = res.getBody();
            System.debug('[DOC-API] ' + method + ' ' + path + ' response status: ' + res.getStatusCode() + ' body: ' + redactUrls(resBody));

            if (res.getStatusCode() >= 200 && res.getStatusCode() < 300) {
                result.body = resBody;
                result.error = null;
            } else {
                result.error = 'HTTP ' + res.getStatusCode() + ' ' + res.getStatus();
                result.body = (resBody != null && resBody.length() > 2000) ? resBody.substring(0, 2000) : resBody;
            }
        } catch (CalloutException e) {
            System.debug('[DOC-API] Callout exception: ' + e.getMessage());
            result.error = 'Callout failed: ' + e.getMessage();
        } catch (Exception e) {
            System.debug('[DOC-API] Unexpected exception: ' + e.getMessage());
            result.error = 'Callout failed: ' + e.getMessage();
        }

        return result;
    }

    private static HttpRequest buildRequest(String method, String path, String body, String apiKey) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint(getBaseUrl() + path);
        req.setMethod(method);
        req.setHeader('Content-Type', 'application/json');
        req.setHeader('Accept', 'application/json');
        req.setHeader('X-Api-Key', apiKey);
        req.setTimeout(120000);

        if (String.isNotBlank(body)) {
            req.setBody(body);
        }

        return req;
    }

    private static String getApiKey() {
        String apiKey = System.Label.TsignApp_API_Key;
        if (String.isBlank(apiKey)) {
            return null;
        }
        return apiKey.trim();
    }

    private static String getBaseUrl() {
        String baseUrl = System.Label.Tsign_Domain;
        if (String.isBlank(baseUrl)) {
            throw new AuraHandledException('Tsign_Domain label is not configured');
        }
        if (baseUrl.endsWith('/')) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }
        return baseUrl;
    }

    private static String getEnvironment() {
        String env = System.Label.TSign_Environment_Label;

        if (String.isBlank(env)) {
            throw new AuraHandledException('TSign_Environment_Label is not configured');
        }

        return env.trim();
    }

    private static String extractFormat(String key, String contentType) {
        if (String.isNotBlank(key) && key.contains('.')) {
            return key.substringAfterLast('.').toLowerCase();
        }
        if (String.isNotBlank(contentType) && contentType.contains('/')) {
            return contentType.substringAfter('/').toLowerCase();
        }
        return 'bin';
    }

    private static String redactUrls(String text) {
        if (String.isBlank(text)) return text;
        return text.replaceAll('(https?://[^"\\s\\?]+)\\?[^"\\s]*', '$1 (signed, redacted)');
    }
}