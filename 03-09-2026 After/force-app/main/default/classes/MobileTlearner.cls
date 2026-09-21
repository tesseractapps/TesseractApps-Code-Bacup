@RestResource(urlMapping='/mobile/tlearner')
global with sharing class MobileTlearner {
    @TestVisible private static String testJsonOverride;
    
    
    @HttpGet
    global static void getFilteredLearningData() {
        RestResponse res = RestContext.response;
        
        String userId = UserInfo.getUserId();
        
        User currentUser = [
            SELECT Id, User_Role__c, User_Type__c
            FROM User
            WHERE Id = :userId
            LIMIT 1
        ];
        
        String role = currentUser.User_Role__c;
        String type = currentUser.User_Type__c;
        
        List<String> userModules = fetchUserModules(userId);
        if (userModules.isEmpty()) {
            res.statusCode = 403;
            res.responseBody = Blob.valueOf('{"error": "No module access"}');
            return;
        }
        
        // Load video JSON from static resource
        String jsonText;
        if (Test.isRunningTest() && testJsonOverride != null) {
            jsonText = testJsonOverride;
        } else {
            StaticResource sr = [SELECT Body FROM StaticResource WHERE Name = 'TLearnerData' LIMIT 1];
            jsonText = sr.Body.toString();
        }
        
        List<Object> rawData = (List<Object>) JSON.deserializeUntyped(jsonText);
        
        List<Object> filtered = new List<Object>();
        Boolean unrestrictedAccess = (role == 'CEO');
        
        for (Object obj : rawData) {
            Map<String, Object> cat = (Map<String, Object>) obj;
            String catId = (String) cat.get('id');
            
            if (!userModules.contains(catId)) continue;
            
            List<Object> rawVideos = (List<Object>) cat.get('videos');
            List<Map<String, Object>> videos = new List<Map<String, Object>>();
            for (Object rv : rawVideos) {
                videos.add((Map<String, Object>) rv);
            }
            
            List<Map<String, Object>> filteredVideos = new List<Map<String, Object>>(videos);
            
            if (!unrestrictedAccess) {
                filteredVideos = filterVideosByAccess(catId, type, videos);
            }
            
            if (!filteredVideos.isEmpty()) {
                Map<String, Object> newCat = new Map<String, Object>(cat);
                newCat.put('videos', filteredVideos);
                newCat.put('count', filteredVideos.size());
                newCat.put('title', cat.get('title').toString().split('\\(')[0].trim() + ' (' + filteredVideos.size() + ')');
                filtered.add(newCat);
            }
        }
        
        
        res.statusCode = 200;
        res.addHeader('Content-Type', 'application/json');
        res.responseBody = Blob.valueOf(JSON.serialize(filtered));
    }
    
    public static List<String> fetchUserModules(String userId) {
        List<String> moduleIds = new List<String>();
        
        try {
            List<Id> ids = new List<Id>{ userId };
                List<Object> result = (List<Object>) UserAccessController.getUserModules(ids);
            
            if (!result.isEmpty()) {
                Map<String, Object> wrapper = (Map<String, Object>) result[0];
                
                if (wrapper.containsKey('Modules')) {
                    List<Object> rawModules = (List<Object>) wrapper.get('Modules');
                    
                    for (Object m : rawModules) {
                        String formatted = String.valueOf(m).toLowerCase().replaceAll('\\s+', '-');
                        moduleIds.add(formatted);
                    }
                }
            }
        } catch (Exception e) {
            System.debug('❌ Failed to fetch modules: ' + e.getMessage());
        }
        
        return moduleIds;
    }
    
    
    public static List<Map<String, Object>> filterVideosByAccess(String catId, String type, List<Map<String, Object>> videos) {
        List<Map<String, Object>> result = new List<Map<String, Object>>();
        List<Map<String, Object>> mobileVideos = new List<Map<String, Object>>();
        
        for (Map<String, Object> video : videos) {
            String platform = ((String) video.get('platform'))?.toLowerCase();
            if (platform == 'mobile application') {
                mobileVideos.add(video);
            }
        }
        
        for (Map<String, Object> video : mobileVideos) {
            String id = (String) video.get('id');
            
            if (catId == 'admin' && type == 'NDIS Org Admin') return mobileVideos;
            if (catId == 'roster-manager') {
                if (type == 'NDIS Org Admin') return mobileVideos;
                if (type == 'NDIS Staff' && id == 'roster-manager-staff') result.add(video);
            }
            if (catId == 'access-manager' && type == 'NDIS Org Admin') return mobileVideos;
            if ((catId == 'repository' || catId == 't-sign') &&
                new List<String>{'NDIS Org Admin', 'HR Admin', 'Facility Admin', 'Roster Manager'}.contains(type)) return mobileVideos;
            
            if (catId == 'incident-register') {
                if ((type == 'NDIS Org Admin' && id == 'incident-register-admin') ||
                    (type == 'NDIS Staff' && id == 'incident-register-staff') ||
                    (type == 'Roster Manager' && id == 'incident-register-rm')) result.add(video);
            }
            if (catId == 'participants') {
                if ((type == 'NDIS Org Admin' && id == 'participants-admin') ||
                    (type == 'NDIS Staff' && id == 'participants-staff') ||
                    (type == 'Roster Manager' && id == 'participants-rm')) result.add(video);
            }
            if (catId == 'sign-in') {
                if ((type == 'NDIS Org Admin' && id == 'sign-in-admin') ||
                    (type == 'NDIS Staff' && id == 'sign-in-staff') ||
                    (type == 'Roster Manager' && id == 'sign-in-rm')) result.add(video);
            }
            if (catId == 'human-resources') {
                if ((type == 'NDIS Org Admin' && id == 'leave-management-admin') ||
                    (type == 'Roster Manager' && id == 'leave-management-rm')) result.add(video);
            }
            if (catId == 'my-profile' && type == 'NDIS Staff' && id == 'leave-management-staff') {
                result.add(video);
            }
        }
        return result;
    }
}