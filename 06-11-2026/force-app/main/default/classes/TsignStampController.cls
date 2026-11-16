public class TsignStampController {

    @AuraEnabled
    public static List<TSign_Stamp__c> getStamps() {

		List<User> currentUsers = [
			SELECT Id, Email, TSign_Org_Id__c, User_Type__c
			FROM User
			WHERE Id = :UserInfo.getUserId()
			LIMIT 1
		];
		if (currentUsers.isEmpty()) {
			throw new AuraHandledException('Current user not found.');
		}

		List<TSign_Staff__c> staffList = [
			SELECT Id
			FROM TSign_Staff__c
			WHERE Email__c = :currentUsers[0].Email
			LIMIT 1
		];
		Id staffId = staffList.isEmpty() ? null : staffList[0].Id;

		return [
            SELECT Id, Name, AWS_URL__c, AWS_Key__c,
                   Is_Default__c, CreatedDate,Stamp_JSON__c 
            FROM TSign_Stamp__c
            WHERE TSign_Staff__c = :staffId
            ORDER BY Is_Default__c DESC, CreatedDate DESC
        ];
    }

    @AuraEnabled
	public static TSign_Stamp__c saveStamp(
		Id recordId,
		String name,
		String imageUrl,
		String imageKey,
        String stampJson,
		Boolean isDefault
	) {
		if (String.isBlank(name)) {
			throw new AuraHandledException('Stamp name is required.');
		}
		if (String.isBlank(imageUrl)) {
			throw new AuraHandledException('Image URL is required.');
		}

		Id safeRecordId = String.isBlank(recordId) ? null : recordId;

		List<User> currentUsers = [
			SELECT Id, Email, TSign_Org_Id__c, User_Type__c
			FROM User
			WHERE Id = :UserInfo.getUserId()
			LIMIT 1
		];
		if (currentUsers.isEmpty()) {
			throw new AuraHandledException('Current user not found.');
		}

		List<TSign_Staff__c> staffList = [
			SELECT Id
			FROM TSign_Staff__c
			WHERE Email__c = :currentUsers[0].Email
			LIMIT 1
		];
		Id staffId = staffList.isEmpty() ? null : staffList[0].Id;

		Savepoint sp = Database.setSavepoint();
		try {
			if (isDefault == true) {
				// All "default" stamps for the SAME staff member
				List<TSign_Stamp__c> others = [
					SELECT Id FROM TSign_Stamp__c
					WHERE Is_Default__c = TRUE
					AND Id != :safeRecordId
					AND TSign_Staff__c = :staffId
				];
				if (!others.isEmpty()) {
					for (TSign_Stamp__c o : others) o.Is_Default__c = false;
					update others;
				}
			}

			TSign_Stamp__c rec = (safeRecordId != null)
				? new TSign_Stamp__c(Id = safeRecordId)
				: new TSign_Stamp__c();

			rec.Name           = name;
			rec.AWS_URL__c     = imageUrl;
			rec.AWS_Key__c     = imageKey;
            rec.Stamp_JSON__c  = stampJson; // <-- Save JSON
			rec.Is_Default__c  = (isDefault == true);
			rec.TSign_Staff__c = staffId;

			if (safeRecordId != null) update rec;
			else                      insert rec;

			return rec;

		} catch (DmlException e) {
			Database.rollback(sp);
			throw new AuraHandledException('Save failed: ' + e.getMessage());
		}
	}

    @AuraEnabled
    public static void deleteStamp(Id recordId) {
        if (recordId == null) {
            throw new AuraHandledException('Record Id required.');
        }
        delete [SELECT Id FROM TSign_Stamp__c WHERE Id = :recordId];
    }

    @AuraEnabled
	public static void setDefaultStamp(Id recordId) {
		if (recordId == null) {
			throw new AuraHandledException('Record Id required.');
		}

		List<User> currentUsers = [
			SELECT Id, Email, TSign_Org_Id__c, User_Type__c
			FROM User
			WHERE Id = :UserInfo.getUserId()
			LIMIT 1
		];
		if (currentUsers.isEmpty()) {
			throw new AuraHandledException('Current user not found.');
		}

		List<TSign_Staff__c> staffList = [
			SELECT Id
			FROM TSign_Staff__c
			WHERE Email__c = :currentUsers[0].Email
			LIMIT 1
		];
		if (staffList.isEmpty()) {
			throw new AuraHandledException('No staff record linked to the current user.');
		}
		Id staffId = staffList[0].Id;

		List<TSign_Stamp__c> all = [
			SELECT Id, Is_Default__c FROM TSign_Stamp__c
			WHERE TSign_Staff__c = :staffId
		];

		// Verify the requested stamp belongs to this staff
		Boolean found = false;
		for (TSign_Stamp__c s : all) {
			if (s.Id == recordId) {
				found = true;
				break;
			}
		}
		if (!found) {
			throw new AuraHandledException('Stamp not found for this user.');
		}

		// Flip default
		for (TSign_Stamp__c s : all) {
			s.Is_Default__c = (s.Id == recordId);
		}
		update all;
	}

	@AuraEnabled
    public static List<TSign_Signature__c> getSignatures() {
        List<User> currentUsers = [
            SELECT Id, Email
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];
        if (currentUsers.isEmpty()) {
            throw new AuraHandledException('Current user not found.');
        }

        List<TSign_Staff__c> staffList = [
            SELECT Id
            FROM TSign_Staff__c
            WHERE Email__c = :currentUsers[0].Email
            LIMIT 1
        ];
        Id staffId = staffList.isEmpty() ? null : staffList[0].Id;

        return [
            SELECT Id, Name, Initials__c, Method__c, Style_Id__c,
                   AWS_URL__c, AWS_Key__c, Is_Default__c, CreatedDate,Signature_JSON__c,
                   TSign_Staff__c
            FROM TSign_Signature__c
            WHERE TSign_Staff__c = :staffId
            ORDER BY Is_Default__c DESC, CreatedDate DESC
        ];
    }

    // ─── Save (insert or update) ───
    @AuraEnabled
    public static TSign_Signature__c saveSignature(
        Id recordId,
        String fullName,
        String initials,
        String method,
        String styleId,
        String imageUrl,
        String imageKey,
        String signatureJson, // <-- 1. Add this parameter
        Boolean isDefault
    ) {
        if (String.isBlank(fullName)) {
            throw new AuraHandledException('Signature name is required.');
        }
        if (String.isBlank(imageUrl)) {
            throw new AuraHandledException('Image URL is required.');
        }

        Id safeRecordId = String.isBlank(recordId) ? null : recordId;

        List<User> currentUsers = [
            SELECT Id, Email
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];
        if (currentUsers.isEmpty()) {
            throw new AuraHandledException('Current user not found.');
        }

        List<TSign_Staff__c> staffList = [
            SELECT Id
            FROM TSign_Staff__c
            WHERE Email__c = :currentUsers[0].Email
            LIMIT 1
        ];
        Id staffId = staffList.isEmpty() ? null : staffList[0].Id;

        Savepoint sp = Database.setSavepoint();
        try {
            if (isDefault == true) {
                List<TSign_Signature__c> others = [
                    SELECT Id FROM TSign_Signature__c
                    WHERE Is_Default__c = TRUE
                      AND Id != :safeRecordId
                      AND TSign_Staff__c = :staffId
                ];
                if (!others.isEmpty()) {
                    for (TSign_Signature__c o : others) o.Is_Default__c = false;
                    update others;
                }
            }

            TSign_Signature__c rec = (safeRecordId != null)
                ? new TSign_Signature__c(Id = safeRecordId)
                : new TSign_Signature__c();

            rec.Name          = fullName;
            rec.Initials__c   = initials;
            rec.Method__c     = method;
            rec.Style_Id__c   = styleId;
            rec.AWS_URL__c    = imageUrl;
            rec.AWS_Key__c    = imageKey;
            rec.Is_Default__c = (isDefault == true);
            rec.TSign_Staff__c = staffId;
            rec.Signature_JSON__c = signatureJson; // <--

            if (safeRecordId != null) update rec;
            else                      insert rec;

            return rec;

        } catch (DmlException e) {
            Database.rollback(sp);
            throw new AuraHandledException('Save failed: ' + e.getMessage());
        }
    }

    // ─── Delete ───
    @AuraEnabled
    public static void deleteSignature(Id recordId) {
        if (recordId == null) {
            throw new AuraHandledException('Record Id required.');
        }
        delete [SELECT Id FROM TSign_Signature__c WHERE Id = :recordId];
    }

    // ─── Set default ───
    @AuraEnabled
    public static void setDefaultSignature(Id recordId) {
        if (recordId == null) {
            throw new AuraHandledException('Record Id required.');
        }

        List<User> currentUsers = [
            SELECT Id, Email
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];
        if (currentUsers.isEmpty()) {
            throw new AuraHandledException('Current user not found.');
        }

        List<TSign_Staff__c> staffList = [
            SELECT Id
            FROM TSign_Staff__c
            WHERE Email__c = :currentUsers[0].Email
            LIMIT 1
        ];
        if (staffList.isEmpty()) {
            throw new AuraHandledException('No staff record linked to the current user.');
        }
        Id staffId = staffList[0].Id;

        List<TSign_Signature__c> all = [
            SELECT Id, Is_Default__c FROM TSign_Signature__c
            WHERE TSign_Staff__c = :staffId
        ];

        Boolean found = false;
        for (TSign_Signature__c s : all) {
            if (s.Id == recordId) { found = true; break; }
        }
        if (!found) {
            throw new AuraHandledException('Signature not found for this user.');
        }

        for (TSign_Signature__c s : all) {
            s.Is_Default__c = (s.Id == recordId);
        }
        update all;
    }
}