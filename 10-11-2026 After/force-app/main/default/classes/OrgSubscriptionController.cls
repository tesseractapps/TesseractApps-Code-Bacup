public with sharing class OrgSubscriptionController {
    
    // Wrapper class to send Org, Contacts, and Subscriptions to LWC
    public class OrgDetailsWrapper {
        @AuraEnabled public TSign_Organisation__c organisation { get; set; }
        @AuraEnabled public List<TSign_Org_Contact__c> primaryContacts { get; set; }
        @AuraEnabled public List<TSign_Subscription__c> subscriptions { get; set; } // NEW
    }

    @AuraEnabled
    public static OrgDetailsWrapper getOrgAndContacts(Id recordId) {
        OrgDetailsWrapper wrapper = new OrgDetailsWrapper();
        
        User objUser = [SELECT Id, TSign_Org_Id__c FROM User WHERE Id = :UserInfo.getUserId()];
        String orgId = objUser.TSign_Org_Id__c;
        
        if(String.isBlank(orgId)) {
            throw new AuraHandledException('No Organisation linked to the current user.');
        }

        // 1. Fetch Organisation
        String query = 'SELECT Id, Name, Legal_Name__c, Business_Type__c, ' +
                        'Address__c, ABN__c, ACN__c, PAN__c, GSTN__c, EIN__c, BN_Canada__c, GST_HST__c, UEN_Singapore__c, GST_Singapore__c, ' +
                       'Account_Type__c, Active__c, ' +
                       'Plan_End_Date__c, Plan_Start_Date__c, Interval__c, Market__c, CreatedDate, ' +
                       'Email__c, Stripe_Customer_ID__c,Phone__c, Billing_Email__c, Billing_Phone__c, Billing_Address__c ' + // Added Billing Fields
                       'FROM TSign_Organisation__c WHERE Id = :orgId';
        
        List<TSign_Organisation__c> orgList = Database.query(query);
        if(!orgList.isEmpty()) {
            wrapper.organisation = orgList[0];
        } else {
            throw new AuraHandledException('Organisation not found.');
        }

        // 2. Fetch Contacts
        wrapper.primaryContacts = [
            SELECT Id, First_Name__c, Last_Name__c, Email__c, Phone__c 
            FROM TSign_Org_Contact__c 
            WHERE TSign_Organisation__c = :orgId
            ORDER BY CreatedDate DESC
        ];

        // 3. Fetch Subscriptions (Invoices)
        wrapper.subscriptions = [
            SELECT Id, Name, Invoice_URL__c, Invoice_ID__c, Invoice_Amount__c, 
                   Stripe_Invoice_Number__c, Date_Issued__c, Subscription_Start_Date__c, Subscription_End_Date__c 
            FROM TSign_Subscription__c 
            WHERE TSign_Organisation__c = :orgId
            ORDER BY CreatedDate DESC
        ];

        return wrapper;
    }

    @AuraEnabled
    public static void saveOrganisationWithContacts(TSign_Organisation__c orgToUpdate, List<TSign_Org_Contact__c> contactsToUpdate) {
        try {
            if (orgToUpdate != null) {
                update orgToUpdate;
            }
            if (contactsToUpdate != null && !contactsToUpdate.isEmpty()) {
                update contactsToUpdate;
            }
        } catch (Exception e) {
            throw new AuraHandledException('Error saving data: ' + e.getMessage());
        }
    }
}