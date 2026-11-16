public with sharing class TSignSessionController {

	private static TSign_Staff__c getCurrentStaff() {

		String userEmail = UserInfo.getUserEmail();

		List<TSign_Staff__c> staffList = [
			SELECT Id, Email__c, Manual_Logout__c
			FROM TSign_Staff__c
			WHERE Email__c = :userEmail
			LIMIT 1
			FOR UPDATE
		];

		if (staffList.isEmpty()) {
			throw new AuraHandledException(
				'T-Sign Staff record not found for the current user email.'
			);
		}

		return staffList[0];
	}

    // First application entry for this browser tab
    @AuraEnabled
    public static Boolean claimAppSession() {

        TSign_Staff__c staff = getCurrentStaff();

        if (staff.Manual_Logout__c == true) {

            // First login or previous manual logout
            staff.Manual_Logout__c = false;
            update staff;

            return true;
        }

        // Previous session was not manually logged out
        // Reset the flag so the next login can be allowed
        staff.Manual_Logout__c = true;
        update staff;

        return false;
    }
    // Set the flag when user manually logs out
    // or when an abandoned session is detected
    @AuraEnabled
    public static void markManualLogout() {

        TSign_Staff__c staff = getCurrentStaff();

        staff.Manual_Logout__c = true;
        update staff;
    }
}