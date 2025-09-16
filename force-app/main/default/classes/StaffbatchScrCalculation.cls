global class StaffbatchScrCalculation implements Queueable {
    public  Id staffId;

    // Constructor to pass the Staff__c Id
    public StaffbatchScrCalculation(Id staffId) {
        this.staffId = staffId;
    }
	
    //system.debug('Scr date '+scrDate);
    // The execute method where the logic is processed
    public void execute(QueueableContext context) {
        // Query the related shifts for the given Staff__c record
          Date scrDate;
        if(Test.isRunningTest()){ 
             scrDate=Date.newInstance(2023, 2, 17); 
        }else{
              scrDate=Date.valueof(System.Label.SCR_Date); 
        }
      
        System.debug('Scr : ' + scrDate);
        List<AggregateResult> results = [
            SELECT Staff__c, SUM(Shift_SCR__c) totalPoints, COUNT(Id) shiftCount 
            FROM ShiftWithStaff__c  
            WHERE Staff__c = :staffId AND date__c  >=:scrDate  AND Shift_SCR__c != null
            GROUP BY Staff__c
        ];
	     System.debug('Scr : ' + results);
        // Logic to process the results and update the SCR field on Staff__c
        if (!results.isEmpty()) {
            AggregateResult ar = results[0];
            Decimal totalPoints = (Decimal) ar.get('totalPoints');
            Decimal shiftCount = (Decimal) ar.get('shiftCount');

            // Avoid division by zero
            Decimal scr = (shiftCount > 0) ? (totalPoints / shiftCount) : 0;

            // Update the Staff__c record
            Staff__c staffRecord = new Staff__c(Id = staffId, SCR__c = scr);
            update staffRecord;
        }
    }
}