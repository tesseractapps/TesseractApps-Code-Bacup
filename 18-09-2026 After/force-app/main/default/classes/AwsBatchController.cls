public with sharing class AwsBatchController {

    // ===== REQUEST CLASSES =====
    public class FileRequest {
        @AuraEnabled public String key;
        @AuraEnabled public String contentType;
    }

    public class Defaults {
        @AuraEnabled public String env;
    }

    public class BatchRequest {
        @AuraEnabled public Defaults defaults;
        @AuraEnabled public List<FileRequest> files;
    }

    // ===== RESPONSE CLASSES =====

    public class FileMeta {
    @AuraEnabled public String bucket;
    @AuraEnabled public String env;
    @AuraEnabled public String key;
    @AuraEnabled public String status;
    @AuraEnabled public String uploadUrl;
    @AuraEnabled public String url;
}

    public class BatchResponse {
       @AuraEnabled public List<FileMeta> files;
        @AuraEnabled public Integer total;
        @AuraEnabled public Integer succeeded;
        @AuraEnabled public Integer failed;
        @AuraEnabled public List<String> fileUrls; // 🔥 ADD THIS
    }

    public class ApiResponse {
    @AuraEnabled public List<ResultItem> results;
    @AuraEnabled public Integer total;
    @AuraEnabled public Integer succeeded;
    @AuraEnabled public Integer failed;
}

public class ResultItem {
    @AuraEnabled public String uploadUrl;
    @AuraEnabled public String key;
    @AuraEnabled public String status;
    @AuraEnabled public Integer index;

    @AuraEnabled public String url;
    @AuraEnabled public String bucket;
    @AuraEnabled public String env;

    // 🔥 optional (for delete errors)
    @AuraEnabled public String error;
    @AuraEnabled public Integer code;
}

    // ===== PUBLIC METHODS =====

   @AuraEnabled
public static BatchResponse uploadFiles(List<Map<String, Object>> files) {
    return callBatchEndpoint('/batch/upload', files);
}

    @AuraEnabled
public static BatchResponse overwriteFiles(List<Map<String, Object>> files) {
    return callBatchEndpoint('/batch/overwrite', files);
}

   @AuraEnabled
public static ApiResponse deleteFiles(List<String> keys) {
    return callDeleteEndpoint('/batch/delete', keys);
}

    // ===== CORE LOGIC =====

private static BatchResponse callBatchEndpoint(String path, List<Map<String, Object>> files) {

    if (files == null || files.isEmpty()) {
        throw new AuraHandledException('Files list cannot be empty');
    }

    // =====================================
    // 🔥 EXTRACT ORG + CALCULATE SIZE
    // =====================================
    Long incomingSize = 0;
    String orgId;

    for (Map<String, Object> f : files) {

        // 🔥 SAFE SIZE CAST
        Object sizeObj = f.get('size');
        if (sizeObj != null) {
            if (sizeObj instanceof Integer) {
                incomingSize += (Integer) sizeObj;
            } else if (sizeObj instanceof Long) {
                incomingSize += (Long) sizeObj;
            } else if (sizeObj instanceof Decimal) {
                incomingSize += ((Decimal) sizeObj).longValue();
            }
        }

        // 🔥 EXTRACT ORG ID
        if (orgId == null && f.get('key') != null) {
            String keyVal = (String) f.get('key');
            List<String> parts = keyVal.split('/');
            if (!parts.isEmpty()) {
                orgId = parts[0];
            }
        }
    }

    // =====================================
    // 🔥 STORAGE VALIDATION
    // =====================================
    if (orgId != null) {
        validateStorageLimit(orgId, incomingSize);
    }

    // =====================================
    // 🔥 BUILD PAYLOAD
    // =====================================
    Map<String, Object> payload = new Map<String, Object>{
        'defaults' => new Map<String, String>{
            'env' => getEnvironment()
        }
    };

    List<Object> fileList = new List<Object>();

    for (Map<String, Object> f : files) {

        String key = (String) f.get('key');
        String contentType = (String) f.get('contentType');

        Map<String, Object> fileMap = new Map<String, Object>{
            'key' => key,
            'contentType' => contentType,
            'format' => extractFormat(key, contentType)
        };

        fileList.add(fileMap);
    }

    payload.put('files', fileList);

    // =====================================
    // 🔥 CALL API
    // =====================================
    HttpRequest req = new HttpRequest();
    req.setEndpoint(getBaseUrl() + path);
    req.setMethod('POST');
    req.setHeader('Content-Type', 'application/json');
    req.setBody(JSON.serialize(payload));
    req.setTimeout(120000);

    try {
        HttpResponse res = new Http().send(req);

        if (res.getStatusCode() < 200 || res.getStatusCode() >= 300) {
            throw new AuraHandledException(
                'Batch operation failed: ' + res.getStatus() + ' ' + res.getBody()
            );
        }

        ApiResponse apiRes = (ApiResponse) JSON.deserialize(res.getBody(), ApiResponse.class);

        // =====================================
        // 🔥 BUILD RESPONSE (UNCHANGED LOGIC)
        // =====================================
        BatchResponse response = new BatchResponse();
        response.files = new List<FileMeta>();
        response.fileUrls = new List<String>();
        response.total = apiRes.total;
        response.succeeded = apiRes.succeeded;
        response.failed = apiRes.failed;

        if (apiRes.results != null) {
            for (ResultItem r : apiRes.results) {
                if (r != null && r.status == 'ok') {

                    FileMeta meta = new FileMeta();
                    meta.bucket = r.bucket;
                    meta.env = r.env;
                    meta.key = r.key;
                    meta.status = r.status;
                    meta.uploadUrl = r.uploadUrl;
                    meta.url = r.url;

                    response.files.add(meta);

                    if (r.url != null) {
                        response.fileUrls.add(r.url);
                    }
                }
            }
        }

        return response;

    } catch (Exception e) {
        throw new AuraHandledException('Callout error: ' + e.getMessage());
    }
}

   private static ApiResponse callDeleteEndpoint(String path, List<String> keys) {

    if (keys == null || keys.isEmpty()) {
        throw new AuraHandledException('Keys cannot be empty');
    }

    // 🔥 Build files array (backend expects this)
    List<Object> fileList = new List<Object>();

    for (String k : keys) {
        if (String.isNotBlank(k)) {
            fileList.add(new Map<String, String>{
                'key' => k.trim()
            });
        }
    }

    if (fileList.isEmpty()) {
        throw new AuraHandledException('Valid keys are required');
    }

    // 🔥 Build payload
    Map<String, Object> payload = new Map<String, Object>{
        'defaults' => new Map<String, String>{
            'env' => getEnvironment()
        },
        'files' => fileList
    };

    String body = JSON.serialize(payload);
    System.debug('🚀 DELETE BODY: ' + body);

    HttpRequest req = new HttpRequest();
    req.setEndpoint(getBaseUrl() + path);
    req.setMethod('DELETE'); // ✅ correct method
    req.setHeader('Content-Type', 'application/json');
    req.setHeader('Accept', 'application/json');
    req.setBody(body);
    req.setTimeout(120000);

    try {
        Http http = new Http();
        HttpResponse res = http.send(req);

        System.debug('🔥 DELETE STATUS: ' + res.getStatus());
        System.debug('🔥 DELETE RESPONSE: ' + res.getBody());

        if (res.getStatusCode() < 200 || res.getStatusCode() >= 300) {
            throw new AuraHandledException(
                'Batch delete failed: ' + res.getStatus() + ' ' + res.getBody()
            );
        }

        // 🔥 Deserialize response
        ApiResponse apiRes = (ApiResponse) JSON.deserialize(res.getBody(), ApiResponse.class);

        return apiRes;

    } catch (Exception e) {
        System.debug('❌ DELETE ERROR: ' + e.getMessage());
        throw new AuraHandledException('Delete callout error: ' + e.getMessage());
    }
}

private static void validateStorageLimit(String orgId, Long incomingSize) {

    System.debug('🔍 [STORAGE] Start validation for orgId: ' + orgId);
    System.debug('📦 [STORAGE] Incoming Size (bytes): ' + incomingSize);

    Organisation__c org = [
        SELECT Organization_Tier__c, Storage_Limit__c
        FROM Organisation__c
        WHERE Id = :orgId
        LIMIT 1
    ];

    System.debug('🏢 [STORAGE] Org Tier: ' + org.Organization_Tier__c);
    System.debug('📊 [STORAGE] Storage Limit (GB): ' + org.Storage_Limit__c);

    // 🚀 Skip premium tiers
    if (org.Organization_Tier__c == 'Scale' ||
        org.Organization_Tier__c == 'Enterprise') {

        System.debug('🚀 [STORAGE] Skipping validation for premium tier');
        return;
    }

    // 🔥 No limit → allow
    if (org.Storage_Limit__c == null) {
        System.debug('⚠️ [STORAGE] No storage limit defined. Allowing upload.');
        return;
    }

    // =========================
    // 🔥 CALL STORAGE API
    // =========================
    HttpRequest req = new HttpRequest();
    req.setEndpoint(getBaseUrl() + '/batch/storage');
    req.setMethod('POST');
    req.setHeader('Content-Type', 'application/json');

    Map<String, Object> body = new Map<String, Object>{
        'env' => getEnvironment(),
        'orgs' => new List<String>{ orgId + '/' }
    };

    req.setBody(JSON.serialize(body));

    System.debug('🌐 [STORAGE] Calling API: ' + req.getEndpoint());
    System.debug('📤 [STORAGE] Request Body: ' + req.getBody());

    HttpResponse res = new Http().send(req);

    System.debug('📥 [STORAGE] Response Status: ' + res.getStatus());
    System.debug('📥 [STORAGE] Response Body: ' + res.getBody());

    if (res.getStatusCode() != 200) {
        throw new AuraHandledException('Storage API failed: ' + res.getBody());
    }

    Map<String, Object> resBody =
        (Map<String, Object>) JSON.deserializeUntyped(res.getBody());

    // =========================
    // 🔥 SAFE CAST USED BYTES
    // =========================
    Object usedObj = resBody.get('grandTotalBytes');
    Long usedBytes = 0;

    if (usedObj instanceof Integer) {
        usedBytes = (Integer) usedObj;
    } else if (usedObj instanceof Long) {
        usedBytes = (Long) usedObj;
    } else if (usedObj instanceof Decimal) {
        usedBytes = ((Decimal) usedObj).longValue();
    }

    Long limitBytes = (Long) org.Storage_Limit__c * 1024 * 1024 * 1024;
    Long totalAfter = usedBytes + incomingSize;

    System.debug('📊 [STORAGE] Used Bytes: ' + usedBytes);
    System.debug('📊 [STORAGE] Limit Bytes: ' + limitBytes);
    System.debug('📊 [STORAGE] After Upload: ' + totalAfter);

    // =========================
    // 🔥 80% WARNING
    // =========================
    Decimal usagePercent = (Decimal) totalAfter / (Decimal) limitBytes * 100;

    System.debug('📈 [STORAGE] Usage % After Upload: ' + usagePercent);

    if (usagePercent >= 80 && usagePercent < 100) {
        System.debug('⚠️ [STORAGE WARNING] Storage usage above 80%!');
    }

    // =========================
    // 🔥 HARD LIMIT CHECK
    // =========================
    if (totalAfter > limitBytes) {
        System.debug('❌ [STORAGE ERROR] Limit exceeded!');
        throw new AuraHandledException('Storage limit exceeded');
    }

    System.debug('✅ [STORAGE] Validation passed');
}
    // ===== HELPER METHODS =====

    // 🔥 Preserve folder, clean only filename
    public static String sanitizeFullPath(String fullPath) {
        if (String.isBlank(fullPath)) return fullPath;

        List<String> parts = fullPath.split('/');

        if (parts.isEmpty()) return fullPath;

        // Last part = filename
        String fileName = parts[parts.size() - 1];

        // Clean filename only
        fileName = fileName.replaceAll('\\s+', '_');
        fileName = fileName.replaceAll('[()]', '');
        fileName = fileName.replaceAll('[^a-zA-Z0-9._-]', '');

        // Replace last element
        parts[parts.size() - 1] = fileName;

        return String.join(parts, '/');
    }

    private static String getEnvironment() {
        String env = System.Label.Environment_Label;

        if (String.isBlank(env)) {
            throw new AuraHandledException('Environment_Label is not configured');
        }

        return env.trim();
    }

    private static String getBaseUrl() {
        String baseUrl = System.Label.Tesseract_Domain;

        if (String.isBlank(baseUrl)) {
            throw new AuraHandledException('Tesseract_Domain label is not configured');
        }

        if (baseUrl.endsWith('/')) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }

        return baseUrl;
    }

    private static String extractFormat(String key, String contentType) {

    // ✅ 1. Try from file extension
    if (String.isNotBlank(key) && key.contains('.')) {
        String ext = key.substringAfterLast('.').toLowerCase();
        return ext;
    }

    // ✅ 2. Fallback from content type
    if (String.isNotBlank(contentType)) {
        if (contentType.contains('/')) {
            return contentType.substringAfter('/').toLowerCase();
        }
    }

    // ✅ 3. Final fallback
    return 'bin';
}

@AuraEnabled
public static Map<String, Object> getUploadConfig(String moduleName) {

    System.debug('🔹 Fetching upload config for module: ' + moduleName);

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
        System.debug('❌ No config found for module: ' + moduleName);

        throw new AuraHandledException('Upload configuration not found for module: ' + moduleName);
    }

    AWS_File_Upload_Config__mdt config = configList[0];

    System.debug('📦 Config Record: ' + config);

    // 🔥 Calculate max size in bytes
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
            // Default fallback → MB
            maxSizeBytes = (Long)(config.Max_File_Size__c * 1024 * 1024);
        }

    } else {
        maxSizeBytes = null;
    }

    System.debug('📏 Max Size (Bytes): ' + maxSizeBytes);
    System.debug('♾️ Is Unlimited: ' + config.Is_Unlimited__c);

    // 🔥 Return ALL required fields
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
public static ApiResponse deleteFilesFromAwsJson(String awsJsonText) {
    if (String.isBlank(awsJsonText)) {
        throw new AuraHandledException('AWS JSON cannot be empty');
    }

    try {
        Object parsed = JSON.deserializeUntyped(awsJsonText);

        List<String> keys = new List<String>();
        extractKeysFromAwsJson(parsed, keys);

        Set<String> uniqueKeys = new Set<String>();
        for (String keyValue : keys) {
            if (String.isNotBlank(keyValue)) {
                uniqueKeys.add(keyValue.trim());
            }
        }

        if (uniqueKeys.isEmpty()) {
            throw new AuraHandledException('No file keys found in AWS JSON');
        }

        return callDeleteEndpoint('/batch/delete', new List<String>(uniqueKeys));

    } catch (AuraHandledException e) {
        throw e;
    } catch (Exception e) {
        throw new AuraHandledException('Failed to parse AWS JSON: ' + e.getMessage());
    }
}

private static void extractKeysFromAwsJson(Object node, List<String> keys) {
    if (node == null) {
        return;
    }

    if (node instanceof Map<String, Object>) {
        Map<String, Object> mapNode = (Map<String, Object>)node;

        for (String prop : mapNode.keySet()) {
            Object value = mapNode.get(prop);

            if (prop == 'key' && value instanceof String && String.isNotBlank((String)value)) {
                keys.add((String)value);
            } else {
                extractKeysFromAwsJson(value, keys);
            }
        }
    } else if (node instanceof List<Object>) {
        for (Object item : (List<Object>)node) {
            extractKeysFromAwsJson(item, keys);
        }
    }
}

}