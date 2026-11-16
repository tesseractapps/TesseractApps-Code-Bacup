public class TsignOrgDetails {

	// @AuraEnabled
    // public static TSign_Organisation__c orgDetails(){
    //     try {
    //         TSign_Organisation__c orgNames= new TSign_Organisation__c();
    //         User objUser = [ SELECT Phone, Id,Organization_Name__c, TSign_Org_Id__c FROM User WHERE Id = : UserInfo.getUserId() ];
    //         orgNames = [Select Id, Name, Account_Type__c,Logo_URL__c,Logo_key__c
    //         from TSign_Organisation__c where Id=:objUser.TSign_Org_Id__c];
    //         return orgNames;
    //     } catch (Exception e) {return null;}
    // }
@AuraEnabled
    public static Map<String, Object> orgDetails(){
        try {
            TSign_Organisation__c orgNames= new TSign_Organisation__c();
            User objUser = [ SELECT Phone, Id,Organization_Name__c, TSign_Org_Id__c FROM User WHERE Id = : UserInfo.getUserId() ];
            orgNames = [Select Id, Name, Account_Type__c,Logo_URL__c,Logo_key__c,
			Email__c, Stripe_Customer_ID__c, Active__c, Trial_Period__c, Plan_Start_Date__c, Plan_End_Date__c, Is_Cancelled__c
            from TSign_Organisation__c where Id=:objUser.TSign_Org_Id__c];

			 List<TSign_Subscription__c> activeSubs = [
                SELECT Id FROM TSign_Subscription__c
                WHERE TSign_Organisation__c = :orgNames.Id AND Active__c = true
            ];
            Boolean hasActiveSubscription = !activeSubs.isEmpty(); 

			 if (orgNames.Is_Cancelled__c == true && orgNames.Plan_End_Date__c != null
                    && orgNames.Plan_End_Date__c < Date.today()) {
               
                for (TSign_Subscription__c activeSub : activeSubs) {
                    activeSub.Active__c = false;
                }
                if (!activeSubs.isEmpty()) {
                    try {
                        update activeSubs;
						hasActiveSubscription = false; 
                        System.debug('TSign orgDetails - ' + activeSubs.size() + ' subscription record(s) set inactive');
                    } catch (Exception ex) {
                        // the org details are still returned - only the inactive update failed
                        System.debug('TSign orgDetails - subscription records not set inactive: ' + ex.getMessage());
                    }
                }
            }
            //return orgNames;
			Map<String, Object> result = new Map<String, Object>(orgNames.getPopulatedFieldsAsMap());
            result.put('daysRemaining', orgNames.Plan_End_Date__c != null ? Date.today().daysBetween(orgNames.Plan_End_Date__c) : null);
            result.put('hasActiveSubscription', hasActiveSubscription);
            return result;
        } catch (Exception e) {return null;}
    }


	@AuraEnabled
		public static List<TSign_Facility__c> fetchFacilitiessForDashboard(){ 
			List<TSign_Facility__c> lstFacility = new List<TSign_Facility__c>();
			
			try {
				User objUser = [
					SELECT Id, Phone, Organization_Name__c, TSign_Org_Id__c, User_Type__c 
					FROM User 
					WHERE Id = :UserInfo.getUserId()
				];
				
				// ---------------------------------------------------------
				// 1. EXISTING LOGIC FOR T SIGN ORG ADMIN
				// ---------------------------------------------------------
				if (objUser.User_Type__c == 'T Sign Org Admin') {
					List<TSign_Organisation__c> orgList = [
						SELECT Id, Name, Account_Type__c
						FROM TSign_Organisation__c 
						WHERE Id = :objUser.TSign_Org_Id__c
						LIMIT 1
					];
					
					if (orgList.isEmpty()) {
						System.debug(LoggingLevel.WARN, 'No Organisation found for user: ' + objUser.Id);
						return lstFacility;
					}
					
					TSign_Organisation__c org = orgList[0];
					
					lstFacility = [
						SELECT Id, Name, Email__c, Active__c
						FROM TSign_Facility__c 
						WHERE TSign_Organisation__r.Id = :org.Id 
						AND Active__c = TRUE 
						ORDER BY Name ASC
					];
					
					System.debug('Facilities found (Admin): ' + lstFacility.size() + ' for Org: ' + org.Id);
					
				} 
				// ---------------------------------------------------------
				// 2. NEW LOGIC FOR OTHER USERS (Manager / Staff)
				// ---------------------------------------------------------
				else {
					     String UserEmail = UserInfo.getUserEmail(); 
					// Find the TSign_Staff__c record related to this User
					List<TSign_Staff__c> staffList = [
						SELECT Id 
						FROM TSign_Staff__c 
						WHERE Email__c = :UserEmail  
						LIMIT 1
					];
					
					if (!staffList.isEmpty()) {
						Id staffId = staffList[0].Id;
						
						// Query the junction object to get the associated facilities
						List<TSign_Staff_Facility__c> staffFacilities = [
							SELECT TSign_Facility__r.Id, TSign_Facility__r.Name, 
								TSign_Facility__r.Email__c, TSign_Facility__r.Active__c
							FROM TSign_Staff_Facility__c
							WHERE TSign_Staff__c = :staffId 
							AND Active__c = TRUE
							AND TSign_Facility__r.Active__c = TRUE
							ORDER BY TSign_Facility__r.Name ASC
						];
						
						// Extract the Facility records
						for (TSign_Staff_Facility__c sf : staffFacilities) {
							if (sf.TSign_Facility__r != null) {
								lstFacility.add(sf.TSign_Facility__r);
							}
						}
					}
					
					System.debug('Facilities found (Non-Admin): ' + lstFacility.size() + ' for User: ' + objUser.Id);
				}
				
			} catch (Exception e) {
				System.debug(LoggingLevel.ERROR, 'fetchFacilitiessForDashboard error: ' + e.getMessage() + ' | ' + e.getStackTraceString());
				// Optionally rethrow so Aura gets the error:
				// throw new AuraHandledException(e.getMessage());
			}
			
			return lstFacility;
		}

		@AuraEnabled
	public static void updateOrgLogo(Id orgId, String logoUrl, String logoKey, String logoSize, String logoFileName) {
		if (orgId == null) {
			throw new AuraHandledException('Organisation Id is required.');
		}

		TSign_Organisation__c org = new TSign_Organisation__c(
			Id = orgId,
			Logo_URL__c = String.isBlank(logoUrl) ? null : logoUrl,
			Logo_key__c = String.isBlank(logoKey) ? null : logoKey,
			Logo_Size__c = String.isBlank(logoSize) ? null : logoSize,
			Logo_File_Name__c = String.isBlank(logoFileName) ? null : logoFileName
		);

		try {
			update org;
		} catch (Exception e) {
			throw new AuraHandledException('Failed to update logo: ' + e.getMessage());
		}
	}

}