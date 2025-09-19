public without sharing class PerformanceController {
   
   @AuraEnabled(cacheable=true)
    public static List<Staff__c> getStaffList(String userType , String orgid) {
        String currentUserEmail = UserInfo.getUserEmail();
        
        if (userType == 'HR Admin') {
            // Query staff who are of type 'NDIS User' and don't have a performance record
            return [SELECT Id, Name,Last_Name__c, Facility_Name__c, Role__c, Email_Address__c FROM Staff__c WHERE Facility__r.Organisation__c = :orgid AND Type_of_User__c = 'NDIS User'
                      AND Id NOT IN (SELECT Staff__c FROM Performance__c WHERE Staff__c != NULL )];
        } else {
            // Query staff for the current user, and ensure they don't have a performance record
            return [SELECT Id,Name,Last_Name__c, Facility_Name__c, Role__c, Email_Address__c FROM Staff__c WHERE Facility__r.Organisation__c = :orgid AND Email_Address__c = :currentUserEmail ];
        }
     }
   

     @AuraEnabled(cacheable=true)
     public static Map<String, Object> getStaffReviewerDetails(String staffOrReviewerId, Boolean isReviewer) {
        Map<String, Object> result = new Map<String, Object>();
         if (isReviewer) {
            // Scenario 1: If it's a Reviewer, fetch only the Reviewer Email
            Staff__c reviewer = [SELECT Email_Address__c FROM Staff__c WHERE Id = :staffOrReviewerId LIMIT 1];
            result.put('reviewerEmail', reviewer.Email_Address__c);
         } else {
            // Scenario 2: If it's a Staff, fetch full Staff details
            Staff__c staff = [SELECT Id, Name, Facility_Name__c, Role__c, Email_Address__c, Emp_Start_Date__c 
                              FROM Staff__c WHERE Id = :staffOrReviewerId LIMIT 1];
            result.put('staffDetails', staff);
         }
         
         return result;
     }
   
     @AuraEnabled(cacheable=true)
     public static List<Library_Goal__c> getLibraryGoals(String orgid ,String staffRole,String levelId  ) {
         List<String> roleList = new List<String>();

        if (!String.isBlank(staffRole)) {
            for (String role : staffRole.split(',')) {
                roleList.add(role.trim());
            }
        }
        List<Library_Goal__c> libraryGoals;
        
        // If levelId is provided, filter by Level__c
        if (String.isNotBlank(levelId)) {
            libraryGoals = [SELECT Id, Name, Level__c, Role__c, Description__c, Actual_Weightage_of_the_Goal__c ,Organization__c FROM Library_Goal__c WHERE Level__c = :levelId AND Organization__c=:orgid  AND Organization__c != NULL AND  Role__c IN :roleList ];
        } else {
            // If levelId is not provided, return all library goals
            libraryGoals = [SELECT Id, Name, Level__c, Role__c, Description__c,Organization__c, Actual_Weightage_of_the_Goal__c  FROM Library_Goal__c WHERE Organization__c=:orgid ORDER BY CreatedDate DESC ];
        }
        
        return libraryGoals;
     }
     @AuraEnabled(cacheable=true)
     public static Library_Goal__c fetchLibraryGoalDetails(String libraryGoalId) {
        // Fetch the specific Library Goal details (Description and Weightage)
        return [SELECT Id, Name, Description__c, Actual_Weightage_of_the_Goal__c 
                FROM Library_Goal__c 
                WHERE Id = :libraryGoalId LIMIT 1];
     }
     @AuraEnabled(cacheable=true)
     public static List<User> getUserData() {
        List<User> users =[SELECT Id,Name,User_Type__c,Email FROM User WHERE User_Type__c !='NDIS Org Admin' AND IsActive= true ];
        return users;
     }
     @AuraEnabled(cacheable=true)
     public static Map<String,String> getUserDetails() {
        Map<String,String>  mapUserType = new  Map<String,String>();
        List<User> users =[SELECT Id,Name,User_Type__c,Email FROM User WHERE  Type_of_User__c='NDIS' AND (User_Role__c ='Portal Account Partner Manager' OR  User_Role__c ='Portal Account Partner User')];
         for(User u:users){
             mapUserType.put(u.User_Type__c, u.Id);
         } 
        return mapUserType;
     }
     @AuraEnabled(cacheable=true)
     public static List<Staff__c> getReviewer(String orgid) {
        List<User> users = [SELECT Id,Name,Email,User_Type__c FROM User WHERE  User_Role__c ='Portal Account Partner Manager' AND User_Type__c!= 'HR Admin'];// WHERE User_Type__c LIKE '%Admin% WITH SECURITY_ENFORCED'
        List<String> userEmails = new List<String>();
        for (User u : users) {
          userEmails.add(u.Email);
        } 
        System.debug('User email :'+userEmails );
        List<Staff__c> staff = [SELECT Id, Name,Last_Name__c, Email_Address__c FROM Staff__c WHERE Facility__r.Organisation__c = :orgid AND Email_Address__c IN :userEmails];
        System.debug('reviewer name: '+staff);
        return staff;
     }

     @AuraEnabled(cacheable=true)
     public static List<Performance__c> getPerformanceRecords(String orgid, String userType) {
        String currentUserEmail = UserInfo.getUserEmail();
        List<Performance__c> performanceRecords = new List<Performance__c>();
    
        // Base query structure
        String baseQuery = 'SELECT Id, Staff__r.Name, Staff__r.Role__c, Reviewer__r.Name, ' +
                           'Review_Period_From__c, Review_Period_To__c, Status__c, Outcome_or_Weightage__c, ' +
                           'Date_Of_Joining__c, Mid_Year_Reveiw_Required__c, Mid_Year_Reveiw_Date__c, ' +
                           'Goal_setting_meeting_conducted_with_Staf__c ' + 
                           'FROM Performance__c ' + 
                           'WHERE Staff__r.Facility__r.Organisation__c = :orgid ';
    
        // String to store dynamic where clause
        String whereClause = '';
    
        // Handling user types
        if (userType == 'HR Admin') {                 //     userType == 'NDIS Org Admin'
            // HR Admin sees records for the entire organization
            whereClause = 'ORDER BY CreatedDate DESC';
        } else if (userType == 'NDIS Staff') {
            // For NDIS Staff or NDIS Org Admin, fetch records where the current user is the Staff
            whereClause = 'AND Staff__r.Email_Address__c = :currentUserEmail ' +
                          'ORDER BY CreatedDate DESC';
        } else if (userType == 'Payroll Admin' || userType == 'Roster Manager' || userType == 'Outlet Admin') {
            // For Payroll Admin, Roster Manager, or Outlet Admin, they should see records where
            // they are either the staff or the reviewer
            whereClause = 'AND (Staff__r.Email_Address__c = :currentUserEmail ' + 
                          'OR Reviewer__r.Email_Address__c = :currentUserEmail) ' +
                          'ORDER BY CreatedDate DESC';
        } else {
            // If userType doesn't match any of the above, return an empty list
            return performanceRecords;
        }
    
        // Combine the base query with the dynamic WHERE clause
        String fullQuery = baseQuery + whereClause;
    
        // Execute the dynamic query
        try {
            performanceRecords = Database.query(fullQuery);
        } catch (Exception e) {
            System.debug('Error in dynamic SOQL: ' + e.getMessage());
        }
    
        return performanceRecords;
    }

    @AuraEnabled
    public static void insertPerformanceGoal(Id performanceGoalId, List<Map<String, Object>> goalDataList) {
        // Create and insert Performance record
        System.debug('insertPerformanceGoal is Executing');
      
        // Create Goal records and associate with Performance
        List<Goal__c> goalsToInsert = new List<Goal__c>();

        for (Map<String, Object> goalData : goalDataList) {
            Goal__c goal = new Goal__c();
            goal.Library_Goal__c=(String) goalData.get('libraryGoalId');
            goal.Goal_Name__c = (String) goalData.get('goalName');
            goal.Private__c = (Boolean) goalData.get('isPrivateNew');
            goal.Start_Date__c = Date.valueOf((String) goalData.get('startDate'));
            goal.End_Date__c = Date.valueOf((String) goalData.get('endDate'));
            goal.Target_Completion_Date__c = Date.valueOf((String) goalData.get('targetDate'));
            goal.Priority__c = (String) goalData.get('priority');
            goal.Actual_Weightage_of_the_Goal__c =  (Decimal) goalData.get('goalActualWeightage');
            goal.Related_Link__c = (String) goalData.get('relatedLink');
            goal.Description__c = (String) goalData.get('description');
            goal.Success_Criteria__c = (String) goalData.get('successCriteria');
            goal.Conversation_Notes__c = (String) goalData.get('conversationNotes');

            // Associate each Goal with the created Performance record
           // goal.Performance__c = performance.Id;
            goal.Performance__c = performanceGoalId;
            goalsToInsert.add(goal);
        }

        // Insert all Goal records
        insert goalsToInsert;
    }
    
    @AuraEnabled(cacheable=true)
    public static Performance__c getPerformanceById(String performanceId) {
       System.debug('Performance id :'+performanceId);
       Performance__c performance=[
            SELECT Id, Staff__r.Name, Staff__r.Role__c, Reviewer__r.Name, 
                   Review_Period_From__c, Review_Period_To__c,Mid_Year_Reveiw_Required__c,
                    Mid_Year_Reveiw_Date__c,Date_Of_Joining__c,Goal_setting_meeting_conducted_with_Staf__c
            FROM Performance__c 
            WHERE Id = :performanceId
        ];
        
        return performance;
   }
   @AuraEnabled(cacheable=true)
   public static List<Goal__c> getGoalsByPerformanceId(Id performanceId) {
        List<Goal__c> goalList = new List<Goal__c>(); 
        
        // Check if performanceId is not null
        if (performanceId != null) {
           goalList = [ SELECT Id, Goal_Name__c, Library_Goal__c,Description__c, Actual_Weightage_of_the_Goal__c, Staff_Comments__c, Staff_Assigned_Weightage__c, Reviewer_Comments__c, 
                       Reviewer_Assigned_Weightage__c,Performance__r.Staff_Email__c, Performance__r.Reviewer_Email__c ,Performance__r.Status__c ,Performance__r.Id FROM Goal__c WHERE Performance__c = :performanceId ORDER BY CreatedDate ASC];
        }
        return goalList; 
   }
 
   @AuraEnabled
   public static void updateGoalData(List<Goal__c> goalList) {
       try {
            // Update the goals based on the list passed from the LWC component
           update goalList;
       } catch (Exception e) {
           throw new AuraHandledException('Error updating goals: ' + e.getMessage());
       }
   }
     
 
  @AuraEnabled
    public static void updatePerformanceStatus(List<Goal__c> goalList) {
        System.debug('Goal List: ' + goalList);
    
        // Map to collect Performance IDs and their respective statuses
        Map<Id, String> performanceStatusMap = new Map<Id, String>();
        Map<Id, Date> staffSubmissionDateMap = new Map<Id, Date>();
        Map<Id, Date> reviewerSubmissionDateMap = new Map<Id, Date>();
        
        for (Goal__c goal : goalList) {
            // Check if Staff comments and weightage are filled
            if (goal.Staff_Comments__c != null && goal.Staff_Assigned_Weightage__c != null) {
                if (goal.Reviewer_Comments__c != null && goal.Reviewer_Assigned_Weightage__c != null) {
                     System.debug('Status: Completed for Performance Id: ' + goal.Performance__c);
                    // Both Staff and Reviewer comments/weightage are filled
                    performanceStatusMap.put(goal.Performance__c, 'Completed');
                    reviewerSubmissionDateMap.put(goal.Performance__c, System.today());
                } else {
                    System.debug('Status: Need Reviewer Acceptance for Performance Id: ' + goal.Performance__c);
                    // Staff comments/weightage are filled, but Reviewer comments/weightage are not
                    performanceStatusMap.put(goal.Performance__c, 'Need Reviewer Acceptance');
                     staffSubmissionDateMap.put(goal.Performance__c, System.today());  
                }
            } else {
                // Staff comments/weightage are NOT filled → Do not update status
                System.debug('Staff fields are incomplete for Goal: ' + goal.Id);
            }
        }
    
        System.debug('Performance Status Map: ' + performanceStatusMap);
        System.debug('Staff Submission Date Map: ' + staffSubmissionDateMap);
        System.debug('Reviewer Submission Date Map: ' + reviewerSubmissionDateMap);
    
        // Fetch Performance records to update their statuses
        List<Performance__c> performanceRecords = [SELECT Id, Status__c,Staff_Submission_Date__c, Reviewer_Submission_Date__c  FROM Performance__c WHERE Id IN :performanceStatusMap.keySet()];
    
        for (Performance__c performance : performanceRecords) {
            if (performanceStatusMap.containsKey(performance.Id)) {
                performance.Status__c = performanceStatusMap.get(performance.Id);
                
                // Set the Staff Comment Submission Date if available in the map
                if (staffSubmissionDateMap.containsKey(performance.Id)) {
                    performance.Staff_Submission_Date__c = staffSubmissionDateMap.get(performance.Id);
                }
    
                // Set the Reviewer Comment Submission Date if available in the map
                if (reviewerSubmissionDateMap.containsKey(performance.Id)) {
                    performance.Reviewer_Submission_Date__c = reviewerSubmissionDateMap.get(performance.Id);
                }
            }
        }
    
        // Update Performance records in the database
        if (!performanceRecords.isEmpty()) {
            update performanceRecords;
        }
    
        System.debug('Performance Records to Update: ' + performanceRecords);
    }
    @AuraEnabled(cacheable=true)
    public static Boolean checkPerformanceRecordExist(String staffId) {
        System.debug('staffId in checkPerformanceRecordExist :  '+staffId);
         // Check if a performance record exists for the given staff
         Integer recordCount = [SELECT COUNT() FROM Performance__c WHERE Staff__r.Id  = :staffId];
         return recordCount > 0;
    }

   @AuraEnabled
    public static void updatePerformanceOutcome(Id performanceId) {
        // Fetch the performance record with related Goal records
        Performance__c performance = [
            SELECT Id, Outcome_or_Weightage__c, (SELECT Reviewer_Assigned_Weightage__c FROM Goals__r)
            FROM Performance__c 
            WHERE Id = :performanceId
            LIMIT 1
        ];
        
        System.debug('Performance Record: ' + performance);
        
        if (performance != null && performance.Goals__r != null && !performance.Goals__r.isEmpty()) {
            Decimal totalReviewerWeightage = 0;
    
            // Calculate the total weightage from related Goal records
            for (Goal__c goal : performance.Goals__r) {
                if (goal.Reviewer_Assigned_Weightage__c != null) {
                    totalReviewerWeightage += goal.Reviewer_Assigned_Weightage__c;
                }
            }
    
            // Update the Outcome field in the Performance record
            performance.Outcome_or_Weightage__c = totalReviewerWeightage;
    
            System.debug('Total Reviewer Weightage: ' + totalReviewerWeightage);
    
            // Perform the update in the database
            update performance;
    
            System.debug('Performance Outcome updated to: ' + performance.Outcome_or_Weightage__c);
        } else {
            System.debug('No related goals found or performance is null.');
        }
    }

}