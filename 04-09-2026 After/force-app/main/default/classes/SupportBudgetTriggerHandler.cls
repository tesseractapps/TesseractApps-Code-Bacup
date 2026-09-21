public class SupportBudgetTriggerHandler {

    public static void updateBudgetTotals(
        Map<Id, Support_Budget__c> newMap,
        Map<Id, Support_Budget__c> oldMap
    ) {

        Set<Id> participantIds = new Set<Id>();

        if (newMap != null) {
            for (Support_Budget__c budget : newMap.values()) {
                if (budget.Support_Client__c != null) {
                    participantIds.add(budget.Support_Client__c);
                }
            }
        }

        if (oldMap != null) {
            for (Support_Budget__c budget : oldMap.values()) {
                if (budget.Support_Client__c != null) {
                    participantIds.add(budget.Support_Client__c);
                }
            }
        }

        System.debug('participantIds ==> ' + participantIds);

        if (participantIds.isEmpty()) {
            return;
        }

        Map<Id, Support_Client__c> participantMap =
            new Map<Id, Support_Client__c>([
                SELECT Id,
                       Plan_Start_Date__c,
                       Plan_End_Date__c,
                       Total_Budget_Spent__c
                FROM Support_Client__c
                WHERE Id IN :participantIds
            ]);

        System.debug('participantMap ==> ' + participantMap);

        List<Support_Budget__c> allBudgets = [
            SELECT Id,
                   Support_Client__c,
                   Budget_Date__c,
                   Total_Amount__c,
                   Actual_Amount__c
            FROM Support_Budget__c
            WHERE Support_Client__c IN :participantIds
        ];

        System.debug('allBudgets ==> ' + allBudgets);

        Map<Id, Decimal> totalsByParticipant = new Map<Id, Decimal>();

        for (Support_Budget__c budget : allBudgets) {

            System.debug('------------------------------------');
            System.debug('Budget Id ==> ' + budget.Id);
            System.debug('Budget Date ==> ' + budget.Budget_Date__c);
            System.debug('Total Amount ==> ' + budget.Total_Amount__c);
            System.debug('Actual Amount ==> ' + budget.Actual_Amount__c);

            Support_Client__c participant =
                participantMap.get(budget.Support_Client__c);

            if (participant == null) {
                System.debug('Participant is NULL');
                continue;
            }

            System.debug('Participant Id ==> ' + participant.Id);
            System.debug('Plan Start ==> ' + participant.Plan_Start_Date__c);
            System.debug('Plan End ==> ' + participant.Plan_End_Date__c);

            if (
                participant.Plan_Start_Date__c != null &&
                participant.Plan_End_Date__c != null &&
                budget.Budget_Date__c != null &&
                budget.Budget_Date__c >= participant.Plan_Start_Date__c &&
                budget.Budget_Date__c <= participant.Plan_End_Date__c
            ) {

                System.debug('Date condition PASSED');

               Decimal amountToUse =
                (budget.Actual_Amount__c != null && budget.Actual_Amount__c > 0)
                ? budget.Actual_Amount__c
                : (budget.Total_Amount__c != null
                    ? budget.Total_Amount__c
                    : 0);
                System.debug('Amount Used ==> ' + amountToUse);

                totalsByParticipant.put(
                    budget.Support_Client__c,
                    (totalsByParticipant.containsKey(
                        budget.Support_Client__c
                    )
                        ? totalsByParticipant.get(
                            budget.Support_Client__c
                        )
                        : 0)
                    + amountToUse
                );

                System.debug(
                    'Running Total ==> ' +
                    totalsByParticipant.get(budget.Support_Client__c)
                );

            } else {

                System.debug('Date condition FAILED');
            }
        }

        System.debug('totalsByParticipant ==> ' + totalsByParticipant);

        List<Support_Client__c> participantsToUpdate =
            new List<Support_Client__c>();

        for (Id participantId : participantIds) {

            Decimal totalValue =
                totalsByParticipant.containsKey(participantId)
                ? totalsByParticipant.get(participantId)
                : 0;

            System.debug(
                'Updating Participant ==> ' +
                participantId +
                ' Total ==> ' +
                totalValue
            );

            participantsToUpdate.add(
                new Support_Client__c(
                    Id = participantId,
                    Total_Budget_Spent__c = totalValue
                )
            );
        }

        System.debug('participantsToUpdate ==> ' + participantsToUpdate);

        if (!participantsToUpdate.isEmpty()) {
            update participantsToUpdate;
            System.debug('Participants Updated Successfully');
        }
    }
}