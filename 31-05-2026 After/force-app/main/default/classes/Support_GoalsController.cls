public with sharing class Support_GoalsController {
    
    public class GoalData {
        @AuraEnabled public Support_Goals__c fullGoal;
        @AuraEnabled public List<Support_SubGoals__c> subGoals;
        @AuraEnabled public Integer totalProgress;
    }
    public class ParticipantGoalsWrapper {
        @AuraEnabled public Id participantId;
        @AuraEnabled public String participantName;
        @AuraEnabled public List<GoalData> goals;
        @AuraEnabled public Integer avgGoalProgress;
        @AuraEnabled public String firstName;
        @AuraEnabled public String lastName;
    }
    
    @AuraEnabled
    public static List<ParticipantGoalsWrapper> getParticipantGoals() {
        
        // Get current user
        User currentUser = [
            SELECT Id, Email 
            FROM User 
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];
        System.debug('Current User: ' + currentUser);
        
        // Get staff record
        List<Staff__c> staffList = [
            SELECT Id 
            FROM Staff__c 
            WHERE Email_Address__c = :currentUser.Email
            LIMIT 1
        ];
        
        if (staffList.isEmpty()) {
            System.debug('No staff record found for the user.');
            return new List<ParticipantGoalsWrapper>();
        }
        
        Id staffId = staffList[0].Id;
        System.debug('Matched Staff Id: ' + staffId);
        
        // Query participants belonging to this staff
        List<Support_Client__c> participants = [
            SELECT Id, Name, SupportClient_To_Staff__c
            FROM Support_Client__c 
            WHERE SupportClient_To_Staff__c = :staffId
        ];
        
        System.debug('Participants: ' + participants);
        
        // Extract participant Ids
        Set<Id> participantIds = new Set<Id>();
        for (Support_Client__c p : participants) {
            participantIds.add(p.Id);
        }
        
        if (participantIds.isEmpty()) {
            System.debug('No participants assigned to this staff');
            return new List<ParticipantGoalsWrapper>();
        }
        
        // Query only goals for those participants
        List<Support_Goals__c> allGoals = [
            SELECT
            Id,
            Name,
            SupportClient_To_Goals__c,
            Status__c,
            
            /* BASICS */
            Priority__c,
            Goal_Category__c,
            Review_Frequency__c,
            
            /* SMART */
            Specific__c,
            Measurable__c,
            Achievable__c,
            Relevant__c,
            Target_Date__c,
            Timeline_Description__c,
            
            /* LINK */
            NDIS_Support_Categories__c,
            Relevent_Providers__c,
            Budget__c,
            
            /* SUB GOALS */
            (SELECT Id, Title__c, Description__c,Status__c FROM Support_SubGoals__r)
            
            FROM Support_Goals__c
            WHERE SupportClient_To_Goals__c IN :participantIds
        ];
        
        System.debug('Goals Found: ' + allGoals);
        
        // Group goals by participant
        Map<Id, List<Support_Goals__c>> goalsByParticipant = new Map<Id, List<Support_Goals__c>>();
        
        for (Support_Goals__c g : allGoals) {
            if (!goalsByParticipant.containsKey(g.SupportClient_To_Goals__c)) {
                goalsByParticipant.put(g.SupportClient_To_Goals__c, new List<Support_Goals__c>());
            }
            goalsByParticipant.get(g.SupportClient_To_Goals__c).add(g);
        }
        
        // Prepare wrapper response
        List<ParticipantGoalsWrapper> responseList = new List<ParticipantGoalsWrapper>();
        
        for (Support_Client__c p : participants) {
            ParticipantGoalsWrapper wrapper = new ParticipantGoalsWrapper();
            wrapper.participantId = p.Id;
            wrapper.participantName = p.Name;
            wrapper.goals = new List<GoalData>();
            
            if (goalsByParticipant.containsKey(p.Id)) {
                for (Support_Goals__c g : goalsByParticipant.get(p.Id)) {
                    GoalData gd = new GoalData();
                    gd.fullGoal = g;  
                    gd.subGoals = g.Support_SubGoals__r != null
                        ? g.Support_SubGoals__r
                        : new List<Support_SubGoals__c>();
                    Integer progress = 0;
                    
                    for (Support_Goal_Review__c r : [
                        SELECT Update_Progress__c
                        FROM Support_Goal_Review__c
                        WHERE Support_Goals_To_GoalReview__c = :g.Id
                    ]) {
                        if (r.Update_Progress__c != null) {
                            progress += Integer.valueOf(r.Update_Progress__c);
                        }
                    }
                    
                    if (progress > 100) {
                        progress = 100;
                    }
                    
                    gd.totalProgress = progress;
                    wrapper.goals.add(gd);
                }
            }
            responseList.add(wrapper);
        }
        return responseList;
    }
    @AuraEnabled
    public static List<Support_Client__c> getActiveParticipants() {
        return [
            SELECT Id, Name, First_Name__c, Last_Name__c, Status__c
            FROM Support_Client__c
            Where Status__c = 'Status__c'
            ORDER BY Name
        ];
    }
    @AuraEnabled
    public static List<Support_Provider__c> getActiveProviders() {
        return [
            SELECT Id, Name
            FROM Support_Provider__c
            WHERE Status__c = 'Active'
            ORDER BY Name
        ];
    }
    //saving
    public class SubGoalWrapper {
        @AuraEnabled public String title;
        @AuraEnabled public String description;
    }
    
    public class GoalSaveWrapper {
        @AuraEnabled public Support_Goals__c goal;
        @AuraEnabled public List<SubGoalWrapper> subGoals;
    }
    
    @AuraEnabled
    public static Id saveGoalWithSubGoals(String payloadJson) {
        if (String.isBlank(payloadJson)) {
            throw new AuraHandledException('Invalid goal payload.');
        }
        
        Map<String, Object> payload =
            (Map<String, Object>) JSON.deserializeUntyped(payloadJson);
        
        if (!payload.containsKey('goal')) {
            throw new AuraHandledException('Invalid goal payload.');
        }
        
        Support_Goals__c goalRec =
            (Support_Goals__c) JSON.deserialize(
                JSON.serialize(payload.get('goal')),
                Support_Goals__c.class
            );
        
        if (goalRec.SupportClient_To_Goals__c == null || goalRec.Name == null) {
            throw new AuraHandledException('Missing required goal fields.');
        }
        
        // ✅ UPSERT (ADD + EDIT)
        upsert goalRec;
        
        // 🔹 DELETE OLD SUB-GOALS IF EDIT
        List<Support_SubGoals__c> existingSubs = [
            SELECT Id
            FROM Support_SubGoals__c
            WHERE Support_Goals_To_SubGoals__c = :goalRec.Id
        ];
        
        if (!existingSubs.isEmpty()) {
            delete existingSubs;
        }
        
        // 🔹 INSERT NEW SUB-GOALS
        List<Support_SubGoals__c> subGoalsToInsert = new List<Support_SubGoals__c>();
        
        if (payload.containsKey('subGoals')) {
            List<Object> subGoalsRaw = (List<Object>) payload.get('subGoals');
            
            for (Object sgObj : subGoalsRaw) {
                Support_SubGoals__c sg =
                    (Support_SubGoals__c) JSON.deserialize(
                        JSON.serialize(sgObj),
                        Support_SubGoals__c.class
                    );
                sg.Support_Goals_To_SubGoals__c = goalRec.Id;
                subGoalsToInsert.add(sg);
            }
        }
        
        if (!subGoalsToInsert.isEmpty()) {
            insert subGoalsToInsert;
        }
        
        return goalRec.Id;
    }
    @AuraEnabled
    public static Map<String, Object> getParticipantGoalsPaged(
        Integer pageSize,
        Integer pageNumber
    ) {
        Map<String, Object> response = new Map<String, Object>();
        try {
            if (pageSize == null || pageSize <= 0) pageSize = 5;
            if (pageNumber == null || pageNumber <= 0) pageNumber = 1;
            Integer offsetVal = (pageNumber - 1) * pageSize;
            // Logged-in user
            User currentUser = [
                SELECT Id, Email, Organization_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];

            List<Organisation__c> orgList = [
                SELECT Id
                FROM Organisation__c
                WHERE Name = :currentUser.Organization_Name__c
                LIMIT 1
            ];
            if (orgList == null) {
                response.put('records', new List<Object>());
                response.put('totalCount', 0);
                response.put('totalPages', 0);
                return response;
            }
            List<Support_Client__c> participants = [
                SELECT Id, Name, First_Name__c, Last_Name__c
                FROM Support_Client__c
                WHERE Organization__c = :orgList[0].Id
                ORDER BY Name
                LIMIT :pageSize
                OFFSET :offsetVal
            ];
            Integer totalCount = [
                SELECT COUNT()
                FROM Support_Client__c
                WHERE Organization__c = :orgList[0].Id
            ];
            Integer totalPages =
                (Integer)Math.ceil((Decimal)totalCount / pageSize);
            Set<Id> participantIds = new Set<Id>();
            for (Support_Client__c p : participants) {
                participantIds.add(p.Id);
            }
            Map<Id, List<Support_Goals__c>> goalsByParticipant = new Map<Id, List<Support_Goals__c>>();
            if (!participantIds.isEmpty()) {
                for (Support_Goals__c g : [
                    SELECT
                    Id, Name, SupportClient_To_Goals__c, Status__c,
                    Priority__c, Goal_Category__c, Review_Frequency__c,
                    Specific__c, Measurable__c, Achievable__c, Relevant__c,
                    Target_Date__c, Timeline_Description__c,
                    NDIS_Support_Categories__c, Relevent_Providers__c, Budget__c,
                    (SELECT Id, Title__c, Description__c,Status__c FROM Support_SubGoals__r)
                    FROM Support_Goals__c
                    WHERE SupportClient_To_Goals__c IN :participantIds
                ]) {
                    if (!goalsByParticipant.containsKey(g.SupportClient_To_Goals__c)) {
                        goalsByParticipant.put(g.SupportClient_To_Goals__c, new List<Support_Goals__c>());
                    }
                    goalsByParticipant.get(g.SupportClient_To_Goals__c).add(g);
                }
            }
            List<ParticipantGoalsWrapper> wrappers = new List<ParticipantGoalsWrapper>();
            
            for (Support_Client__c p : participants) {
                ParticipantGoalsWrapper w = new ParticipantGoalsWrapper();
                w.participantId = p.Id;
                w.participantName = p.Name;
                w.firstName = p.First_Name__c;
                w.lastName = p.Last_Name__c;
                w.goals = new List<GoalData>();
                Integer totalProgressSum = 0;
                Integer goalCount = 0;
                if (goalsByParticipant.containsKey(p.Id)) {
                    for (Support_Goals__c g : goalsByParticipant.get(p.Id)) {
                        GoalData gd = new GoalData();
                        gd.fullGoal = g;
                        gd.subGoals = g.Support_SubGoals__r != null
                            ? g.Support_SubGoals__r
                            : new List<Support_SubGoals__c>();
                        Integer progress = 0;
                        for (Support_Goal_Review__c r : [
                            SELECT Update_Progress__c
                            FROM Support_Goal_Review__c
                            WHERE Support_Goals_To_GoalReview__c = :g.Id
                        ]) {
                            if (r.Update_Progress__c != null) {
                                progress += Integer.valueOf(r.Update_Progress__c);
                            }
                        }
                        
                        if (progress > 100) {
                            progress = 100;
                        }
                        
                        gd.totalProgress = progress;
                        
                        if (
                            g.Status__c == 'Active' ||
                            g.Status__c == 'In Progress' ||
                            g.Status__c == 'Completed'
                        ) {
                            totalProgressSum += progress;
                            goalCount++;
                        }
                        w.goals.add(gd);
                    }
                }
                w.avgGoalProgress =
                    goalCount > 0
                    ? Math.round((Decimal) totalProgressSum / goalCount)
                    : 0;
                wrappers.add(w);
            }
            response.put('records', wrappers);
            response.put('totalCount', totalCount);
            response.put('pageNumber', pageNumber);
            response.put('pageSize', pageSize);
            response.put('totalPages', totalPages);
            response.put('status', 'SUCCESS');
        }
        catch (Exception e) {
            response.put('status', 'ERROR');
            response.put('message', e.getMessage());
        }
        return response;
    }
    
    public class GoalReviewWrapper {
        @AuraEnabled public List<Support_Goal_Review__c> reviews;
        @AuraEnabled public Integer totalProgress;
        @AuraEnabled public Integer remainingProgress;
        @AuraEnabled public Boolean isCompleted;
        @AuraEnabled public Decimal totalBudgetSpent;
        @AuraEnabled public Decimal budgetSpentPercent;
    }
    
    /**
* Fetch all reviews for a Goal + progress calculation
*/
    @AuraEnabled
    public static GoalReviewWrapper getGoalReviews(Id goalId) {
        if (goalId == null) {
            throw new AuraHandledException('Goal Id is required');
        }
        
        List<Support_Goal_Review__c> reviews = [
            SELECT
            Id,
            Progress_Summary__c,
            Evidence_Of_Progress__c,
            Barriers_Identified__c,
            Enablers__c,
            Next_Steps__c,
            Review_Date__c,
            Update_Progress__c,
            BudgetSpent__c,
            CreatedDate
            FROM Support_Goal_Review__c
            WHERE Support_Goals_To_GoalReview__c = :goalId
            ORDER BY CreatedDate ASC
        ];
        
        Integer totalProgress = 0;
        
        for (Support_Goal_Review__c r : reviews) {
            if (r.Update_Progress__c != null) {
                totalProgress += Integer.valueOf(r.Update_Progress__c);
            }
        }
        
        if (totalProgress > 100) {
            totalProgress = 100;
        }
        
        Decimal totalBudgetSpent = 0;        
        for (Support_Goal_Review__c r : reviews) {
            if (r.BudgetSpent__c != null) {
                totalBudgetSpent += r.BudgetSpent__c;
            }
        }
        
        Decimal allocatedBudget = [
            SELECT Budget__c
            FROM Support_Goals__c
            WHERE Id = :goalId
        ].Budget__c;
        Decimal budgetSpentPercent = 0;
        
        if (allocatedBudget != null && allocatedBudget > 0) {
            budgetSpentPercent = Math.min(
                100,
                (totalBudgetSpent / allocatedBudget) * 100
            );
        }
        GoalReviewWrapper wrapper = new GoalReviewWrapper();
        wrapper.reviews = reviews;
        wrapper.totalProgress = totalProgress;
        wrapper.remainingProgress = Math.max(0, 100 - totalProgress);
        wrapper.isCompleted = (totalProgress >= 100);
        wrapper.totalBudgetSpent = totalBudgetSpent;
        wrapper.budgetSpentPercent = budgetSpentPercent;
        
        return wrapper;
    }
    
    /**
* Save or Update a Goal Review with validation
*/
    @AuraEnabled
    public static GoalReviewWrapper saveGoalReview(
        Support_Goal_Review__c reviewRec
    ) {
        if (reviewRec == null ||
            reviewRec.Support_Goals_To_GoalReview__c == null) {
                throw new AuraHandledException('Invalid Review data');
            }
        
        Id goalId = reviewRec.Support_Goals_To_GoalReview__c;
        // Fetch existing reviews (exclude current if edit)
        List<Support_Goal_Review__c> existingReviews = [
            SELECT Id, Update_Progress__c
            FROM Support_Goal_Review__c
            WHERE Support_Goals_To_GoalReview__c = :goalId
            AND Id != :reviewRec.Id
        ];
        Integer usedProgress = 0;
        for (Support_Goal_Review__c r : existingReviews) {
            if (r.Update_Progress__c != null) {
                usedProgress += Integer.valueOf(r.Update_Progress__c);
            }
        }
        Integer newProgress = 0;
        if (reviewRec.Update_Progress__c != null) {
            newProgress = Integer.valueOf(reviewRec.Update_Progress__c);
        }
        Integer remaining = 100 - usedProgress;
        // Validation
        if (newProgress <= 0) {
            throw new AuraHandledException(
                'Progress must be greater than 0'
            );
        }
        if (newProgress > remaining) {
            throw new AuraHandledException(
                'You can update only ' + remaining + '% more for this goal'
            );
        }
        // Save review (insert or update)
        upsert reviewRec;
        Integer totalProgress = usedProgress + newProgress;
        // Auto-complete Goal
        Support_Goals__c goal = new Support_Goals__c(
            Id = goalId,
            Status__c = (totalProgress >= 100 ? 'Completed' : 'In Progress')
        );
        
        update goal;
        
        return getGoalReviews(goalId);
    }
    
    @AuraEnabled
    public static Map<String, Integer> getGlobalDashboardMetrics() {
        
        Map<String, Integer> result = new Map<String, Integer>{
            'activeGoals' => 0,
                'inProgressGoals' => 0,
                'completedGoals' => 0,
                'avgProgress' => 0
                };
                    
            // Logged-in user → Staff
            User currentUser = [
                SELECT Id, Email, Organization_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];

            List<Organisation__c> orgList = [
                SELECT Id
                FROM Organisation__c
                WHERE Name = :currentUser.Organization_Name__c
                LIMIT 1
            ];
        
        if (orgList == null) return result;
        
        // All participants
        List<Support_Client__c> participants = [
            SELECT Id
            FROM Support_Client__c
            WHERE Organization__c = :orgList[0].Id
        ];
        
        if (participants.isEmpty()) return result;
        
        Set<Id> participantIds = new Set<Id>();
        for (Support_Client__c p : participants) {
            participantIds.add(p.Id);
        }
        
        // All relevant goals
        List<Support_Goals__c> goals = [
            SELECT Id, Status__c, SupportClient_To_Goals__c
            FROM Support_Goals__c
            WHERE SupportClient_To_Goals__c IN :participantIds
            AND Status__c IN ('Active', 'In Progress', 'Completed')
        ];
        
        // Status counts
        for (Support_Goals__c g : goals) {
            if (g.Status__c == 'Active') {
                result.put('activeGoals', result.get('activeGoals') + 1);
            } else if (g.Status__c == 'In Progress') {
                result.put('inProgressGoals', result.get('inProgressGoals') + 1);
            } else if (g.Status__c == 'Completed') {
                result.put('completedGoals', result.get('completedGoals') + 1);
            }
        }
        
        // Progress calculation (participant avg)
        Map<Id, List<Integer>> progressByParticipant = new Map<Id, List<Integer>>();
        
        for (Support_Goals__c g : goals) {
            Integer progress = 0;
            
            for (Support_Goal_Review__c r : [
                SELECT Update_Progress__c
                FROM Support_Goal_Review__c
                WHERE Support_Goals_To_GoalReview__c = :g.Id
            ]) {
                if (r.Update_Progress__c != null) {
                    progress += Integer.valueOf(r.Update_Progress__c);
                }
            }
            
            if (progress > 100) progress = 100;
            
            if (!progressByParticipant.containsKey(g.SupportClient_To_Goals__c)) {
                progressByParticipant.put(
                    g.SupportClient_To_Goals__c,
                    new List<Integer>()
                );
            }
            progressByParticipant.get(g.SupportClient_To_Goals__c).add(progress);
        }
        
        Integer participantCount = 0;
        Integer participantAvgSum = 0;
        
        for (Id pid : progressByParticipant.keySet()) {
            List<Integer> vals = progressByParticipant.get(pid);
            if (!vals.isEmpty()) {
                Integer sum = 0;
                for (Integer v : vals) sum += v;
                participantAvgSum += Math.round((Decimal) sum / vals.size());
                participantCount++;
            }
        }
        
        if (participantCount > 0) {
            result.put(
                'avgProgress',
                Math.round((Decimal) participantAvgSum / participantCount)
            );
        }
        
        return result;
    }
    @AuraEnabled
    public static List<Support_Notes__c> getNotesByGoal(Id goalId) {
        if (goalId == null) {
            return new List<Support_Notes__c>();
        }
        return [
            SELECT
                Id,
                Entry_Date__c,
                Activity_Details__c,
                Billable__c,
                CreatedDate
            FROM Support_Notes__c
            WHERE SupportNotes_To_SupportGoals__c = :goalId
            ORDER BY CreatedDate DESC
        ];
    }

    @AuraEnabled
public static void updateSubGoalStatus(Id subGoalId, String status) {
    if (subGoalId == null || String.isBlank(status)) {
        throw new AuraHandledException('Invalid sub-goal update request');
    }

    Support_SubGoals__c sg = [
        SELECT Id, Status__c
        FROM Support_SubGoals__c
        WHERE Id = :subGoalId
        LIMIT 1
    ];

    sg.Status__c = status;
    update sg;
}


}