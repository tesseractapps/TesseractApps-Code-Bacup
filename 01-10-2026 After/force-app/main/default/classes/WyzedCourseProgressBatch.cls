public with sharing class WyzedCourseProgressBatch {
    /**
 * Get user's course list with progress status (In-Progress & Pending)
 * @param userId - The Wyzed user ID
 * @return List of courses with progress information
 */
@AuraEnabled(cacheable=false)
public static List<Map<String, Object>> getUserCoursesWithProgress(String userId) {
    
    Organisation__c orgDetails = WyzedIntegrationHandler.getOrgDetails();
    String TENANT_ID = orgDetails.Wyzed_Tenant_ID__c;
    
    List<Map<String, Object>> result = new List<Map<String, Object>>();
    
    try {
        // Step 1: Get all enrolments for the user
        List<Map<String, Object>> enrolments = getUserEnrolments(TENANT_ID, userId);
        
        if (enrolments == null || enrolments.isEmpty()) {
            System.debug('No enrolments found for user: ' + userId);
            return result;
        }
        
        // Step 2: Prepare course keys for batch progress request
        List<Map<String, Object>> courseKeys = new List<Map<String, Object>>();
        Map<String, Map<String, Object>> enrolmentMap = new Map<String, Map<String, Object>>();
        
        for (Map<String, Object> enrolment : enrolments) {
            Map<String, Object> courseKey = (Map<String, Object>) enrolment.get('course_key');
            
            if (courseKey != null && courseKey.containsKey('id')) {
                String courseId = String.valueOf(courseKey.get('id'));
                String courseOwnerId = String.valueOf(courseKey.get('user_id'));
                
                // Store enrolment metadata
                enrolmentMap.put(courseId, enrolment);
                
                // Add to keys for progress batch
                Map<String, Object> key = new Map<String, Object>{
                    'course_key' => new Map<String, Object>{
                        'user_id' => Long.valueOf(courseOwnerId),
                        'id' => Long.valueOf(courseId)
                    },
                    'user_id' => Long.valueOf(userId)
                };
                courseKeys.add(key);
            }
        }
        
        // Step 3: Get course progress for all enrolments
        Map<String, Map<String, Object>> progressMap = getCourseProgressBatch(TENANT_ID, courseKeys);
        
        // Step 4: Get course details (names, etc.)
        Map<String, Map<String, Object>> courseDetailsMap = getCourseDetailsBatch(TENANT_ID, courseKeys);
        
        // Step 5: Combine all data
        for (Map<String, Object> key : courseKeys) {
            Map<String, Object> courseKey = (Map<String, Object>) key.get('course_key');
            String courseId = String.valueOf(courseKey.get('id'));
            String courseOwnerId = String.valueOf(courseKey.get('user_id'));
            
            Map<String, Object> enrolment = enrolmentMap.get(courseId);
            Map<String, Object> progress = progressMap.get(courseId);
            Map<String, Object> courseDetails = courseDetailsMap.get(courseId);
            
            if (progress != null) {
                Map<String, Object> courseData = new Map<String, Object>();
                
                // Course basic info
                courseData.put('course_id', courseId);
                courseData.put('course_owner_id', courseOwnerId);
                
                if (courseDetails != null) {
                    courseData.put('course_name', courseDetails.get('name'));
                    courseData.put('permalink', courseDetails.get('permalink'));
                    courseData.put('is_published', courseDetails.get('is_published'));
                    courseData.put('is_archived', courseDetails.get('is_archived'));
                }
                
                // Progress info
                Map<String, Object> activityProgress = (Map<String, Object>) progress.get('activity_progress');
                Integer completed = activityProgress != null ? Integer.valueOf(activityProgress.get('completed')) : 0;
                Integer total = activityProgress != null ? Integer.valueOf(activityProgress.get('total')) : 0;
                
                // Determine status (In-Progress or Pending)
                // is_started = completed > 0 (as per Wyzed documentation)
                Boolean isStarted = completed > 0;
                Boolean isCompleted = (Boolean) progress.get('is_completed');
                
                String status;
                if (isCompleted) {
                    status = 'Completed';
                } else if (isStarted) {
                    status = 'In-Progress';
                } else {
                    status = 'Pending';
                }
                
                courseData.put('status', status);
                courseData.put('is_started', isStarted);
                courseData.put('is_completed', isCompleted);
                courseData.put('completed_count', completed);
                courseData.put('total_activities', total);
                courseData.put('completion_percentage', total > 0 ? (completed * 100 / total) : 0);
                
                // Enrolment metadata
                Map<String, Object> metadata = (Map<String, Object>) enrolment.get('metadata');
                if (metadata != null) {
                    courseData.put('is_overdue', metadata.get('is_overdue'));
                    courseData.put('enrolled_at', enrolment.get('created_at'));
                }
                
                // Progress details
                courseData.put('is_graded', progress.get('is_graded'));
                if (progress.get('grading_result') != null) {
                    courseData.put('grading_result', progress.get('grading_result'));
                }
                
                result.add(courseData);
            }
        }
        
        System.debug('Returning ' + result.size() + ' courses for user: ' + userId);
        return result;
        
    } catch (Exception e) {
        System.debug('Error in getUserCoursesWithProgress: ' + e.getMessage());
        throw new AuraHandledException('Failed to get user courses: ' + e.getMessage());
    }
}

/**
 * Step 1: Get all enrolments for a user
 */
private static List<Map<String, Object>> getUserEnrolments(String tenantId, String userId) {
    
    String path = '/v3_service/tenants/' + tenantId + '/enrolments/?user_id=' + userId;
    List<Map<String, Object>> allEnrolments = new List<Map<String, Object>>();
    
    String cursor = null;
    Boolean hasMore = true;
    Integer maxIterations = 10;
    Integer iteration = 0;
    
    while (hasMore && iteration < maxIterations) {
        String url = path;
        if (cursor != null) {
            url += '&cursor=' + EncodingUtil.urlEncode(cursor, 'UTF-8');
        }
        
        HttpResponse res = WyzedAuthService.callApi(url, 'GET');
        
        if (res.getStatusCode() == 200) {
            Map<String, Object> responseMap = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            
            List<Object> enrolments = (List<Object>) responseMap.get('enrolments');
            if (enrolments != null) {
                for (Object obj : enrolments) {
                    allEnrolments.add((Map<String, Object>) obj);
                }
            }
            
            cursor = (String) responseMap.get('next_cursor');
            hasMore = (Boolean) responseMap.get('more');
            
            if (!hasMore || cursor == null) break;
        } else {
            throw new CalloutException('Failed to get enrolments: ' + res.getBody());
        }
        
        iteration++;
    }
    
    return allEnrolments;
}

/**
 * Step 2: Get course progress batch
 */
public static Map<String, Map<String, Object>> getCourseProgressBatch(String tenantId, List<Map<String, Object>> courseKeys) {
    
    String path = '/v3_service/tenants/' + tenantId + '/course_progress/batch/read';
    
    Map<String, Object> requestBody = new Map<String, Object>{
        'keys' => courseKeys
    };
    
    HttpResponse res = WyzedAuthService.callApiWithBody(path, 'POST', JSON.serialize(requestBody));
    
    Map<String, Map<String, Object>> progressMap = new Map<String, Map<String, Object>>();
    
    if (res.getStatusCode() == 200) {
        Map<String, Object> responseMap = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
        List<Object> progresses = (List<Object>) responseMap.get('course_progresses');
        
        if (progresses != null) {
            for (Object obj : progresses) {
                Map<String, Object> progress = (Map<String, Object>) obj;
                Map<String, Object> courseKey = (Map<String, Object>) progress.get('course_key');
                
                if (courseKey != null && courseKey.containsKey('id')) {
                    String courseId = String.valueOf(courseKey.get('id'));
                    progressMap.put(courseId, progress);
                }
            }
        }
    }
    
    return progressMap;
}

/**
 * Step 3: Get course details batch - OPTIMIZED (Single API Call)
 */
public static Map<String, Map<String, Object>> getCourseDetailsBatch(String tenantId, List<Map<String, Object>> courseKeys) {
    
    Map<String, Map<String, Object>> courseMap = new Map<String, Map<String, Object>>();
    
    // Get unique course IDs from courseKeys
    Set<String> uniqueCourseIds = new Set<String>();
    for (Map<String, Object> key : courseKeys) {
        Map<String, Object> courseKey = (Map<String, Object>) key.get('course_key');
        if (courseKey != null) {
            String courseId = String.valueOf(courseKey.get('id'));
            uniqueCourseIds.add(courseId);
        }
    }
    
    // SINGLE API CALL - Fetch all courses at once
    String path = '/v3_service/tenants/' + tenantId + '/courses/';
    HttpResponse res = WyzedAuthService.callApi(path, 'GET'); 
    
    if (res.getStatusCode() == 200) {
        Map<String, Object> responseMap = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
        List<Object> allCourses = (List<Object>) responseMap.get('courses');
        
        if (allCourses != null) {
            for (Object obj : allCourses) {
                Map<String, Object> course = (Map<String, Object>) obj;
                String courseId = String.valueOf(course.get('id'));
                
                // Only store courses that our user is enrolled in
                if (uniqueCourseIds.contains(courseId)) {
                    courseMap.put(courseId, course);
                    System.debug('Course Name found: ' + course.get('name') + ' for ID: ' + courseId);
                }
            }
        }
    } else {
        System.debug('Failed to fetch courses: ' + res.getBody());
    }
    
    return courseMap;
}

/**
 * LWC friendly method to get user courses (returns JSON string)
 */
    @AuraEnabled(cacheable=false)
    public static String getUserCoursesWithProgressJSON() {
        String userEmail = UserInfo.getUserEmail();
        List<Staff__c> staffDetails=[Select Id,Wyzed_User_Id__c from Staff__c where Email_Address__c =:userEmail];
         String userId =staffDetails[0].Wyzed_User_Id__c !=null ? staffDetails[0].Wyzed_User_Id__c : '';
    //   String userId='5098125745979392';
       // String userId='6111019127275520' ;
        List<Map<String, Object>> courses = getUserCoursesWithProgress(userId);
        return JSON.serialize(courses);
    }

@AuraEnabled
public static void assignSingleCourseToMultipleUsers(
    String courseId,
    String courseOwnerUserId,
    List<String> learnerUserIds
) {

    Organisation__c orgDetails = WyzedIntegrationHandler.getOrgDetails();
    String tenantId = orgDetails.Wyzed_Tenant_ID__c;

    // 🔥 Path
    String path =
        '/v3_service/tenants/' +
        tenantId +
        '/enrolments/batch/create';

    // 🔥 Build enrolments
    List<Object> enrolmentKeys = new List<Object>();

    for (String learnerId : learnerUserIds) {

        Map<String, Object> enrolment = new Map<String, Object>{
            'course_key' => new Map<String, Object>{
                'id' => Long.valueOf(courseId),
                'user_id' => Long.valueOf(courseOwnerUserId)
            },
            'user_id' => Long.valueOf(learnerId)
        };

        enrolmentKeys.add(enrolment);
    }

    // 🔥 Request body
    Map<String, Object> requestBody = new Map<String, Object>{
        'enrolment_keys' => enrolmentKeys
    };

    // 🔥 API Call
    HttpResponse res = WyzedAuthService.callApiWithBody(
        path,
        'POST',
        JSON.serialize(requestBody)
    );

    System.debug(
        'REQUEST BODY => ' +
        JSON.serializePretty(requestBody)
    );

    System.debug(
        'RESPONSE => ' +
        res.getBody()
    );

    if (res.getStatusCode() != 200) {
        throw new AuraHandledException(
            'Course assignment failed: ' + res.getBody()
        );
    }
}


@AuraEnabled(cacheable=false)
public static List<Staff__c> getStaffByFacilityAndRoles(
    List<String> selectedRoleFacilityValues
) {

    // 🔥 facility -> roles map
    Map<Id, Set<String>> facilityRoleMap = new Map<Id, Set<String>>();

    Set<Id> facilityIds = new Set<Id>();
    Set<String> roleNames = new Set<String>();

    // 🔥 Build maps
    for (String val : selectedRoleFacilityValues) {

        List<String> parts = val.split('\\|');

        if (parts.size() != 2) {
            continue;
        }

        String roleName = parts[0].trim();
        Id facilityId = (Id) parts[1].trim();

        facilityIds.add(facilityId);
        roleNames.add(roleName);

        if (!facilityRoleMap.containsKey(facilityId)) {
            facilityRoleMap.put(facilityId, new Set<String>());
        }

        facilityRoleMap.get(facilityId).add(roleName);
    }

    System.debug('facilityRoleMap => ' + facilityRoleMap);

    // 🔥 Fetch staff using child role object
    List<Staff__c> allStaff = [

        SELECT
            Id,
            Name,
            Email_Address__c,
            Contact_Number__c,
            Facility__c,
            Wyzed_User_Id__c,

            (
                SELECT
                    Id,
                    RoleName__c,
                    Facility__c,
                    Active__c

                FROM StaffRoles__r

                WHERE
                    Active__c = true
                    AND Facility__c IN :facilityIds
                    AND RoleName__c IN :roleNames
            )

        FROM Staff__c

        WHERE Id IN (

            SELECT StaffRole_To_Staff__c
            FROM StaffRole__c

            WHERE
                Active__c = true
                AND Facility__c IN :facilityIds
                AND RoleName__c IN :roleNames
        ) and Wyzed_User_Id__c !=null AND Wyzed_Learner__c =true
    ];

    List<Staff__c> filteredStaff = new List<Staff__c>();

    // 🔥 Exact role + facility validation
    for (Staff__c staff : allStaff) {

        Boolean matched = false;

        if (staff.StaffRoles__r != null) {

            for (SObject roleRec : staff.StaffRoles__r) {

                Id roleFacilityId =
                    (Id) roleRec.get('Facility__c');

                String roleName =
                    (String) roleRec.get('RoleName__c'); 

                if (
                    facilityRoleMap.containsKey(roleFacilityId)
                    &&
                    facilityRoleMap.get(roleFacilityId)
                        .contains(roleName)
                ) {

                    matched = true;
                    break;
                }
            }
        }

        if (matched) {
            filteredStaff.add(staff);
        }
    }

    System.debug(
        'filteredStaff size => ' +
        filteredStaff.size()
    );

    return filteredStaff;
}

}