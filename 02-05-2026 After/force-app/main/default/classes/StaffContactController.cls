public without sharing class StaffContactController {

    @AuraEnabled
	public static List<Staff_Contact__c> saveStaffContacts(String staffId, String contactsJson) {

		System.debug('🔵 START saveStaffContacts');
		System.debug('🔵 Staff Id: ' + staffId);
		System.debug('🔵 Contacts JSON: ' + contactsJson);

		if (staffId == null || String.isBlank(contactsJson)) {
			System.debug('⚠ staffId or contactsJson is null/blank → returning empty list');
			return new List<Staff_Contact__c>();
		}

		// 🔹 Step 1: Fetch existing contacts
		List<Staff_Contact__c> existingContacts = [
			SELECT Id FROM Staff_Contact__c WHERE Staff__c = :staffId
		];

		System.debug('🔵 Existing Contacts Count: ' + existingContacts.size());

		if (!existingContacts.isEmpty()) {
			System.debug('🗑 Deleting existing contacts...');
			delete existingContacts;
		}

		// 🔹 Step 2: Deserialize JSON
		List<Object> contactListRaw = (List<Object>) JSON.deserializeUntyped(contactsJson);

		System.debug('🔵 Incoming Contacts Count: ' + contactListRaw.size());

		List<Staff_Contact__c> contactsToInsert = new List<Staff_Contact__c>();
		List<Staff_Contact__c> responseList = new List<Staff_Contact__c>();

		Integer index = 0;

		for (Object obj : contactListRaw) {
			Map<String, Object> con = (Map<String, Object>) obj;

			System.debug('➡ Processing Row Index: ' + index);
			System.debug('➡ Raw Contact Data: ' + con);

			String firstName = (String) con.get('firstName');
			Object phoneObj = con.get('contactNumber');
			String phoneStr = phoneObj != null ? String.valueOf(phoneObj) : null;

			System.debug('   First Name: ' + firstName);
			System.debug('   Phone: ' + phoneStr);

			Boolean isEmpty = String.isBlank(firstName) && String.isBlank(phoneStr);

			System.debug('   Is Empty Row: ' + isEmpty);

			Staff_Contact__c c = new Staff_Contact__c();

			if (!isEmpty) {
				
				c.Staff__c = staffId;
				c.First_Name__c = firstName;
				c.Last_Name__c = (String) con.get('lastName');
				c.Phone__c = Decimal.valueOf(phoneStr);
				c.Relationship__c = (String) con.get('relationship');
				c.Email__c = (String) con.get('email');
				c.Name = (String) con.get('contactType');

				System.debug('   ✅ Adding Contact to Insert List: ' + c);

				contactsToInsert.add(c);
			} else {
				System.debug('   ⚠ Skipping Empty Row');
			}

			responseList.add(c);
			index++;
		}

		// 🔹 Step 3: Insert
		System.debug('🔵 Total Contacts to Insert: ' + contactsToInsert.size());

		if (!contactsToInsert.isEmpty()) {
			insert contactsToInsert;
			System.debug('✅ Insert Completed');
		} else {
			System.debug('⚠ No Contacts to Insert');
		}

		System.debug('🔵 Response List Size: ' + responseList.size());
		System.debug('🔵 END saveStaffContacts');

		return responseList;
	}
}