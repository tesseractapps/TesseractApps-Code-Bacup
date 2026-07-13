public class SupportCoordinationReports {

	@AuraEnabled
    public static List<Support_Client__c> getParticipantUtilization(Id participantId) {
        try {
            if (participantId == null) {
                throw new AuraHandledException('Participant Id is required');
            }

            return [
                Select Id, First_Name__c, Last_Name__c, (SELECT Id, Name, BudgetAllocation__c, Budget_Spent_to_Date__c  From Support_CoordinatorCatalogueGroup__r ), (SELECT Id, Name, BudgetAllocation__c, Budget_Spent_to_Date__c From Support_CatalogueGroups__r) From Support_Client__c  WHERE Id = :participantId ORDER BY CreatedDate DESC
            ];

        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

	@AuraEnabled
	public static List<Support_Client__c> getParticipantReconciliation(Id participantId) {
		try {
			return [
				SELECT
					Id,
					First_Name__c,
					Last_Name__c,
					(
						SELECT
							Id,
							Name,
							Actual_Amount__c,
							Budget_Date__c,
							Service_Item__c,
							Total_Amount__c
						FROM Support_Budgets__r
						WHERE Budget_Date__c < TODAY
						ORDER BY Budget_Date__c DESC
					)
				FROM Support_Client__c
				WHERE Id = :participantId
				LIMIT 1
			];} catch (Exception e) {throw new AuraHandledException('Error fetching reconciliation data: ' + e.getMessage());
		}
	}

	@AuraEnabled
	public static List<Support_Client__c> getParticipantCaseNotes(Id participantId) {
		System.debug('================ getParticipantCaseNotes START ================');
		System.debug('Input participantId: ' + participantId);

		try {
			System.debug('Entering try block');

			if (participantId == null) {
				System.debug('participantId is NULL');
			} else {
				System.debug('participantId is valid: ' + participantId);
			}

			System.debug('Preparing SOQL query for Support_Client__c and related SupportNotes1__r');

			List<Support_Client__c> participantCaseNotes = [
				SELECT
					Id,
					First_Name__c,
					Last_Name__c,
					(
						SELECT
							Id,
							Name,
							Entry_Date__c,
							Notes_Type__c,
							Billable__c,
							Duration_Hours__c,
							Support_CoordinatorCatalogue__c,
							Support_CoordinatorCatalogue__r.Support_Item_Name__c,
							Total_Cost__c,
							Support_CoordinatorCatalogueGroup__c,
							Activity_Details__c,
							Entry_Cost_c__c,
							Created_From__c,
							CreatedDate,
							CreatedBy.Name
						FROM SupportNotes1__r
						WHERE Created_From__c = 'Case'
						ORDER BY Entry_Date__c DESC
					)
				FROM Support_Client__c
				WHERE Id = :participantId
				LIMIT 1
			];

			System.debug('SOQL query executed successfully');
			System.debug('Number of Support_Client__c records returned: ' + participantCaseNotes.size());

			if (!participantCaseNotes.isEmpty()) {
				Support_Client__c participant = participantCaseNotes[0];

				System.debug('Participant Record Id: ' + participant.Id);
				System.debug('Participant First Name: ' + participant.First_Name__c);
				System.debug('Participant Last Name: ' + participant.Last_Name__c);

				if (participant.SupportNotes1__r != null) {
					System.debug('Number of related case notes found: ' + participant.SupportNotes1__r.size());

					for (Support_Notes__c note : participant.SupportNotes1__r) {
						System.debug('---------------- CASE NOTE ----------------');
						System.debug('Note Id: ' + note.Id);
						System.debug('Note Name: ' + note.Name);
						System.debug('Entry Date: ' + note.Entry_Date__c);
						System.debug('Notes Type: ' + note.Notes_Type__c);
						System.debug('Billable: ' + note.Billable__c);
						System.debug('Duration Hours: ' + note.Duration_Hours__c);
						System.debug('Support Catalogue Id: ' + note.Support_CoordinatorCatalogue__c);

						if (note.Support_CoordinatorCatalogue__r != null) {
							System.debug(
								'Support Item Name: ' +
								note.Support_CoordinatorCatalogue__r.Support_Item_Name__c
							);
						} else {
							System.debug('Support_CoordinatorCatalogue__r is NULL');
						}

						System.debug('Total Cost: ' + note.Total_Cost__c);
						System.debug('Catalogue Group: ' + note.Support_CoordinatorCatalogueGroup__c);
						System.debug('Activity Details: ' + note.Activity_Details__c);
						System.debug('Entry Cost: ' + note.Entry_Cost_c__c);
						System.debug('Created From: ' + note.Created_From__c);
						System.debug('Created Date: ' + note.CreatedDate);
						System.debug('Created By: ' + note.CreatedBy.Name);
					}
				} else {
					System.debug('No related SupportNotes1__r records found');
				}
			} else {
				System.debug('No Support_Client__c record found for participantId: ' + participantId);
			}

			System.debug('Returning participant case notes');
			System.debug('================ getParticipantCaseNotes END SUCCESS ================');

			return participantCaseNotes;

		} catch (Exception e) {
			System.debug('================ ERROR IN getParticipantCaseNotes ================');
			System.debug('Exception Message: ' + e.getMessage());
			System.debug('Exception Type: ' + e.getTypeName());
			System.debug('Stack Trace: ' + e.getStackTraceString());

			throw new AuraHandledException(
				'Error fetching case notes: ' + e.getMessage()
			);
		}
	}

}