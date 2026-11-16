public class ShiftwithStaffControllers2 {

    @AuraEnabled(cacheable=true)
    public static List<ShiftWrapper> getStaffWeekData() {
        String userEmail = UserInfo.getUserEmail(); 
        System.debug('Entered getStaffWeekData method');
        System.debug('User Email: ' + userEmail);
        
        // Validate user email
        if (String.isBlank(userEmail)) {throw new AuraHandledException('User email cannot be null or empty.');
        }

        try {
            // Query shift data for the past 7 days
            System.debug('Querying ShiftwithStaff__c records...');
            List<AggregateResult> results = [
                SELECT Date__c day, 
                       SUM(Duration__c) totalDuration, 
                       SUM(Actual_Duration__c) actualDuration, 
                       Status__c status
                FROM ShiftwithStaff__c
                WHERE Date__c = LAST_N_DAYS:7 
                AND Staff__r.Email_Address__c = :userEmail
                GROUP BY Date__c, Status__c
                ORDER BY Date__c, Status__c
            ];

            System.debug('Query Result - Aggregated Data: ' + results);

            // Process results into ShiftWrapper objects
            List<ShiftWrapper> shiftData = new List<ShiftWrapper>();
            for (AggregateResult result : results) {
                shiftData.add(new ShiftWrapper(
                    (Date) result.get('day'),
                    ((Double) result.get('totalDuration')), // Sum of Duration__c
                    ((Double) result.get('actualDuration')), // Sum of Actual_Duration__c
                    (String) result.get('status')
                ));
            }

            System.debug('Processed Shift Data: ' + shiftData);

            // Return the result
            System.debug('Exiting getStaffWeekData method successfully');
            return shiftData;
        } catch (Exception e) {throw new AuraHandledException('An error occurred while fetching shift data: ' + e.getMessage());
        }
    }

    // Wrapper class definition
    public class ShiftWrapper {
        @AuraEnabled
        public Date day { get; set; }
        @AuraEnabled
        public Double totalDuration { get; set; }
        @AuraEnabled
        public Double actualDuration { get; set; }
        @AuraEnabled
        public String status { get; set; }

        public ShiftWrapper(Date day, Double totalDuration, Double actualDuration, String status) {
            this.day = day;
            this.totalDuration = totalDuration;
            this.actualDuration = actualDuration;
            this.status = status;
        }
    }
}