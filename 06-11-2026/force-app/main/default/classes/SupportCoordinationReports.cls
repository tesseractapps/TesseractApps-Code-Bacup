public class SupportCoordinationReports {

	@AuraEnabled
	public static List<Support_Client__c> getParticipantUtilization(
		List<Id> participantIds
	) {
		try {

			if (participantIds == null || participantIds.isEmpty()) {
				throw new AuraHandledException(
					'At least one Participant is required'
				);
			}

			return [
				SELECT
					Id,
					First_Name__c,
					Last_Name__c,

					(
						SELECT
							Id,
							Name,
							BudgetAllocation__c,
							Budget_Spent_to_Date__c
						FROM Support_CoordinatorCatalogueGroup__r
					),

					(
						SELECT
							Id,
							Name,
							BudgetAllocation__c,
							Budget_Spent_to_Date__c
						FROM Support_CatalogueGroups__r
					)

				FROM Support_Client__c
				WHERE Id IN :participantIds
				ORDER BY First_Name__c, Last_Name__c
			];

		} catch (Exception e) {

			throw new AuraHandledException(
				'Error fetching utilization data: ' +
				e.getMessage()
			);
		}
	}

	@AuraEnabled
	public static List<Support_Client__c> getParticipantReconciliation(
		List<Id> participantIds,
		Date fromDate,
		Date toDate
	) {
		try {

			if (participantIds == null || participantIds.isEmpty()) {
				throw new AuraHandledException(
					'At least one Participant is required'
				);
			}

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
						WHERE Budget_Date__c >= :fromDate
						AND Budget_Date__c <= :toDate
						ORDER BY Budget_Date__c DESC
					)

				FROM Support_Client__c
				WHERE Id IN :participantIds
				ORDER BY First_Name__c, Last_Name__c
			];

		} catch (Exception e) {

			throw new AuraHandledException(
				'Error fetching reconciliation data: ' +
				e.getMessage()
			);
		}
	}

	@AuraEnabled
	public static List<Support_Client__c> getParticipantCaseNotes(
		List<Id> participantIds,
		Date fromDate,
		Date toDate
	) {

		System.debug('================ getParticipantCaseNotes START ================');
		System.debug('Participant Ids: ' + participantIds);
		System.debug('Participant Count: ' + (participantIds == null ? 0 : participantIds.size()));
		System.debug('From Date: ' + fromDate);
		System.debug('To Date: ' + toDate);

		try {

			if (participantIds == null || participantIds.isEmpty()) {
				System.debug('❌ No Participant Ids Received');
				return new List<Support_Client__c>();
			}

			System.debug('🔍 Executing SOQL Query...');

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
							Charge_Level__c,
							Support_CoordinatorCatalogueGroup__c,
							Activity_Details__c,
							Entry_Cost_c__c,
							Created_From__c,
							CreatedDate,
							CreatedBy.Name
						FROM SupportNotes1__r
						WHERE Created_From__c = 'Case'
						AND Entry_Date__c >= :fromDate
						AND Entry_Date__c <= :toDate
						ORDER BY Entry_Date__c DESC
					)
				FROM Support_Client__c
				WHERE Id IN :participantIds
			];

			System.debug('✅ Participants Returned: ' + participantCaseNotes.size());

			for (Support_Client__c participant : participantCaseNotes) {

				System.debug('------------------------------------------------');
				System.debug('Participant Id: ' + participant.Id);
				System.debug('Participant Name: ' +
					participant.First_Name__c + ' ' +
					participant.Last_Name__c
				);

				Integer noteCount = participant.SupportNotes1__r == null
					? 0
					: participant.SupportNotes1__r.size();

				System.debug('Case Notes Count: ' + noteCount);

				if (participant.SupportNotes1__r != null) {

					for (Support_Notes__c note : participant.SupportNotes1__r) {

						System.debug('----- CASE NOTE -----');
						System.debug('Note Id: ' + note.Id);
						System.debug('Note Name: ' + note.Name);
						System.debug('Entry Date: ' + note.Entry_Date__c);
						System.debug('Notes Type: ' + note.Notes_Type__c);
						System.debug('Billable: ' + note.Billable__c);
						System.debug('Duration Hours: ' + note.Duration_Hours__c);
						System.debug('Created From: ' + note.Created_From__c);
						System.debug('Total Cost: ' + note.Total_Cost__c);
						System.debug('Activity Details: ' + note.Activity_Details__c);

						if (note.Support_CoordinatorCatalogue__r != null) {
							System.debug(
								'Support Item Name: ' +
								note.Support_CoordinatorCatalogue__r.Support_Item_Name__c
							);
						} else {
							System.debug('Support Catalogue Relationship is NULL');
						}
					}
				}
			}

			System.debug('================ getParticipantCaseNotes END SUCCESS ================');

			return participantCaseNotes;

		} catch (Exception e) {

			System.debug('================ getParticipantCaseNotes ERROR ================');
			System.debug('Exception Message: ' + e.getMessage());
			System.debug('Exception Type: ' + e.getTypeName());
			System.debug('Stack Trace: ' + e.getStackTraceString());

			throw new AuraHandledException(
				'Error fetching case notes: ' + e.getMessage()
			);
		}
	}

	@AuraEnabled
	public static List<Map<String, Object>> getProviderReport() {

		System.debug('================ getProviderReport START ================');

		User u = [
			SELECT Id, Email, Organization_Name__c
			FROM User
			WHERE Id = :UserInfo.getUserId()
			LIMIT 1
		];

		System.debug('User: ' + u.Id);
		System.debug('Organization Name: ' + u.Organization_Name__c);

		Organisation__c orgRecord = [
			SELECT Id, Name
			FROM Organisation__c
			WHERE Name = :u.Organization_Name__c
			LIMIT 1
		];

		System.debug('Organization Id: ' + orgRecord.Id);

		List<Support_Provider__c> providers = [
			SELECT
				Id,
				Name,
				Contact_Email__c,
				Status__c,
				Service_Type__c,
				Service_Offerings__c,
				Registration_Number__c,
				Phone__c,
				ABN__c,
				Address__Street__s,
				Address__City__s,
				Address__StateCode__s,
				Address__PostalCode__s,
				Address__CountryCode__s,
				Current_Capacity__c
			FROM Support_Provider__c
			WHERE Organization__c = :orgRecord.Id
			AND Status__c = 'Active'
			ORDER BY Name
		];System.debug('Providers Found: ' + providers.size());List<Map<String, Object>> results = new List<Map<String, Object>>();for (Support_Provider__c p : providers) {Map<String, Object> providerMap = new Map<String, Object>();providerMap.put('id', p.Id);providerMap.put('name', p.Name);providerMap.put('email', p.Contact_Email__c);providerMap.put('status', p.Status__c);providerMap.put('serviceType', p.Service_Type__c);providerMap.put('serviceOfferings', p.Service_Offerings__c);providerMap.put('registrationNumber', p.Registration_Number__c);providerMap.put('phone', p.Phone__c);providerMap.put('abn', p.ABN__c);providerMap.put('street', p.Address__Street__s);providerMap.put('city', p.Address__City__s);providerMap.put('state', p.Address__StateCode__s);providerMap.put('postalCode', p.Address__PostalCode__s);providerMap.put('country', p.Address__CountryCode__s);providerMap.put('capacity', p.Current_Capacity__c);results.add(providerMap);

			System.debug('Provider Added: ' + p.Name);
		}

		System.debug('Returning Provider Records: ' + results.size());
		System.debug('================ getProviderReport END ================');

		return results;
	}

}