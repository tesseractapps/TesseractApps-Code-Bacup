public without sharing class TSignPortalUserController {

    // AuraHandledException can only be thrown in Aura/LWC context.
    // This method is also called from the Stripe webhook (REST context),
    // so a plain custom exception is used instead.
    public class TSignRegistrationException extends Exception {}

    public static String createTSignPortalUser(Map<String, Object> details) {
        Savepoint sp = Database.setSavepoint();

        try {
            if (details == null) {
                throw new TSignRegistrationException('Request details are required.');
            }

            String email = (String) details.get('email');
            if (String.isBlank(email)) {
                throw new TSignRegistrationException('Email is required.');
            }

            String accountType = (String) details.get('accountType');
          //  String userType    = (String) details.get('userType');
            String userType='T Sign Org Admin';
            String role = '';
           /* if (userType == 'T Sign Org Admin') {
                role = 'Portal Account Partner Executive';   // Org Admin
            } else if (userType == 'T Sign Manager') {
                role = 'Portal Account Partner Manager';     // Roster Admin
            } else if (userType == 'T Sign Staff') {
                role = 'Portal Account Partner User';        // Staff
            } */
            
            // Account and role names come from Product_User_Setting__mdt (record TSign).
            // Partner roles are named after their account, e.g. 'Portal Account Partner Executive'.
            Product_User_Setting__mdt settings = Product_User_Setting__mdt.getInstance('TSign');
            if (settings == null) {
                throw new TSignRegistrationException('Product_User_Setting__mdt record "TSign" was not found.');
            }
            role = settings.Partner_Account_Name__c + ' Partner Executive';

            // Account required for the portal Contact (replaces the hard-coded Id,
            // which differs between sandbox and production).
              List<Account> accounts = [SELECT Id, Name From Account Where Name = :settings.Partner_Account_Name__c];

            if (accounts.isEmpty()) {
                throw new TSignRegistrationException('Account "' + settings.Partner_Account_Name__c + '" was not found.');
            }

            // Duplicate guard: Stripe retries webhooks, so the same signup can
            // arrive more than once. Return without creating anything (no throw,
            // so the webhook still answers 200 and Stripe stops retrying).
            // Only TSign staff count: an NDIS contact with the same email must
            // still be able to sign up for TSign.
            List<TSign_Staff__c> existingStaff = [
                SELECT Id
                FROM TSign_Staff__c
                WHERE Email__c = :email
                LIMIT 1
            ];
            if (!existingStaff.isEmpty()) {
                return 'A TSign staff member with this email already exists. No records created.';
            }

            // Address values from the request.
            String addressLine1      = (String) details.get('addressLine1');
            String addressLine2      = (String) details.get('addressLine2');
            String addressCity       = (String) details.get('addressCity');
            String addressState      = (String) details.get('addressState');       // e.g. NSW
            String addressPostalCode = (String) details.get('addressPostalCode');
            String addressCountry    = (String) details.get('addressCountry');     // e.g. AU

            String fullAddress = addressLine1;
            if (!String.isBlank(addressLine2)) {
                fullAddress = String.isBlank(fullAddress)
                    ? addressLine2
                    : fullAddress + ', ' + addressLine2;
            }

            // 1. TSign Organisation.
            TSign_Organisation__c organisation = new TSign_Organisation__c();
            if ('individual'.equalsIgnoreCase(accountType)) {
                organisation.Name = (String) details.get('firstName') + ' '
                                  + (String) details.get('lastName');
            } else {
                organisation.Name = (String) details.get('organisationName');
            }
            organisation.Active__c                = true;
            organisation.Email__c                = email;
            organisation.Phone__c 					=(String) details.get('phone');
            organisation.Account_Type__c         = accountType =='organisation' ?'Organisation' :'Individual';
            organisation.Address__Street__s      = fullAddress;
            organisation.Address__City__s        = addressCity;
            organisation.Address__StateCode__s   = addressState;
            organisation.Address__PostalCode__s  = addressPostalCode;
            organisation.Address__CountryCode__s = addressCountry;
            String teamSizeStr = (String) details.get('teamSize');
            if (String.isNotBlank(teamSizeStr)) {
                organisation.Team_Size__c = Integer.valueOf(teamSizeStr);
            }
          // Safely parse the trial string to a Boolean
            String trialString = (String) details.get('trial');
            if (String.isNotBlank(trialString)) {
                organisation.Trial_Period__c = Boolean.valueOf(trialString);
            } else {
                organisation.Trial_Period__c = false;
            }
           organisation.Interval__c = (String) details.get('interval') == 'year' ? 'Yearly' : 'Monthly';
           
          
             String rawDetailsJson = JSON.serialize(details);
            organisation.Meta_Data_Deatils__c=rawDetailsJson;
            
            
            // =========================================================
            // 1. SAVE ADDITIONAL ORGANISATION FIELDS
            // =========================================================
            organisation.Stripe_Customer_ID__c = (String) details.get('stripeCustomerId');
            organisation.Tax_Behavior__c       = (String) details.get('taxBehavior');
            organisation.Stripe_Price_ID__c    = (String) details.get('stripePriceId');
            organisation.Trading_Name__c       = (String) details.get('tradingName');
            organisation.Business_Type__c      = (String) details.get('businessType');
            
            String currencyUsed = (String) details.get('currency');
            organisation.Currency__c = currencyUsed;
            
                      // Ensure the currency is uppercase for case-insensitive matching in the switch statement
            String currencyUpperCase = String.isNotBlank(currencyUsed) ? currencyUsed.toUpperCase() : '';

            switch on currencyUpperCase {
                when 'AUD' {
                    organisation.Market__c = 'Australia';
                    organisation.ABN__c = (String) details.get('id_au_abn');
                    organisation.ACN__c = (String) details.get('id_au_acn');
                }
                when 'INR', 'IN' {
                    organisation.Market__c = 'India';
                    organisation.PAN__c = (String) details.get('id_in_pan');
                    organisation.GSTN__c = (String) details.get('id_in_gst');   
                }
                when 'USD' {
                    organisation.Market__c = 'USA';
                    organisation.EIN__c = (String) details.get('id_us_ein');
                }
                when 'CAD' {
                    organisation.Market__c = 'Canada';
                    organisation.BN_Canada__c = (String) details.get('id_ca_bn');
                    organisation.GST_HST__c = (String) details.get('id_ca_gst_hst');
                }
                when 'SGD' {
                    organisation.Market__c = 'Singapore';
                    organisation.UEN_Singapore__c = (String) details.get('id_sg_uen');
                    organisation.GST_Singapore__c = (String) details.get('id_sg_gst');
                }
                when else {
                    // Optional: Handle any other currencies here if needed, or leave blank
                }
            }
            
            // =========================================================
            // 2. MAP BILLING ADDRESS AND CONTACT INFO
            // =========================================================
            organisation.Billing_Address__Street__s      = fullAddress; 
            organisation.Billing_Address__City__s  = addressCity;
            organisation.Billing_Address__StateCode__s   = addressState;
            organisation.Billing_Address__PostalCode__s  = addressPostalCode;
            organisation.Billing_Address__CountryCode__s = addressCountry;
            
            organisation.Billing_Email__c       = email;
            organisation.Billing_Phone__c       = (String) details.get('phone'); // From your metadata details
            
            String periodEndStr = (String) details.get('currentPeriodEnd');
            String periodStartStr = (String) details.get('currentPeriodStart');
            
            // FIX 2: Start and End dates correctly mapped
            if (String.isNotBlank(periodStartStr)) {
                organisation.Plan_Start_Date__c = Date.valueOf(periodStartStr.left(10)); 
            }
            if (String.isNotBlank(periodEndStr)) {
                organisation.Plan_End_Date__c = Date.valueOf(periodEndStr.left(10));
            }

            
            // Insert Organisation
            insert organisation;
            
            // =========================================================
            // 3. CREATE CHILD SUBSCRIPTION RECORD
            // =========================================================
            TSign_Subscription__c newSub = new TSign_Subscription__c();
            newSub.TSign_Organisation__c = organisation.Id; // Assuming the lookup API name is Organisation__c
            newSub.Active__c = true;
            
            // Map Invoice Fields
            newSub.Invoice_URL__c        = (String) details.get('invoiceUrl');
            newSub.Invoice_ID__c         = (String) details.get('invoiceId');
            newSub.Stripe_Invoice_Number__c = (String) details.get('invoiceNumber');
            newSub.Stripe_Price_ID__c    = (String) details.get('stripePriceId');
            newSub.Subscription_ID__c    = (String) details.get('subscriptionId');
           String invoiceAmtStr = (String) details.get('invoiceAmountPaid');
            if (String.isNotBlank(invoiceAmtStr)) {
                newSub.Invoice_Amount__c = Decimal.valueOf(invoiceAmtStr);
            }
            
            // Parse Dates safely
            if (String.isNotBlank(periodEndStr)) {
                newSub.Subscription_End_Date__c = Date.valueOf(periodEndStr.left(10)); 
            }
            if (String.isNotBlank(periodStartStr)) {
                newSub.Subscription_Start_Date__c = Date.valueOf(periodStartStr.left(10));
            }
            
            
        
            String acceptedTermsStr = (String) details.get('acceptedTermsAt');
            if(String.isNotBlank(acceptedTermsStr)) {
                newSub.Date_Issued__c = DateTime.valueOf(acceptedTermsStr.replace('T', ' ').replace('Z', '')).date();
            }
            
            insert newSub;

            // Note: If you want to save the Current Period dates INTO the Organisation object as well, 
            // you can do it before the organisation insert:
            // String orgPeriodEnd = (String) details.get('currentPeriodEnd');
            // if(String.isNotBlank(orgPeriodEnd)) organisation.Current_Period_End__c = Date.valueOf(orgPeriodEnd.left(10));

            // 2. Primary organisation contact (Business accounts only).
           if ('organisation'.equalsIgnoreCase(accountType)) {
                TSign_Org_Contact__c primaryContact = new TSign_Org_Contact__c();
                primaryContact.TSign_Organisation__c = organisation.Id;
                primaryContact.First_Name__c =(String) details.get('firstName');
                primaryContact.Last_Name__c  = (String) details.get('lastName');
                primaryContact.Email__c      = email;
                primaryContact.Phone__c      = (String) details.get('phone');
                insert primaryContact;
            }

            // 3. TSign Facility — lookup set BEFORE insert, so no update is needed.
            TSign_Facility__c facility = new TSign_Facility__c();
            facility.Active__c               = true;
            facility.Name                    = organisation.Name;
            facility.TSign_Organisation__c   = organisation.Id;
            facility.Phone__c 				 =(String) details.get('phone');
            facility.Email__c      			 = email;
            facility.Address__Street__s      = fullAddress;
            facility.Address__City__s        = addressCity;
            facility.Active__c= true;
            facility.Address__StateCode__s   = addressState;
            facility.Address__PostalCode__s  = addressPostalCode;
            facility.Address__CountryCode__s = addressCountry;
            insert facility;

            TSign_Contact__c  con = new TSign_Contact__c();
            con.Name=(String) details.get('firstName') +' '+(String) details.get('lastName');
            con.First_Name__c =(String) details.get('firstName');
            con.Last_Name__c =(String) details.get('lastName');
            con.TSign_Facility__c = facility.Id;
            con.Contact_Type__c ='Internal';
            con.Email__c =email;
            con.TSign_Organisation__c   = organisation.Id;
            con.Contact_Number__c =(String) details.get('phone');
            con.Address__Street__s      = fullAddress;
            con.Address__City__s        = addressCity;
            con.Address__StateCode__s   = addressState;
            con.Address__PostalCode__s  = addressPostalCode;
            con.Address__CountryCode__s = addressCountry;
            insert con;


            // 4. TSign Staff.
            TSign_Staff__c staff = new TSign_Staff__c();
            staff.Status__c               = true;
            staff.First_Name__c           = (String) details.get('firstName');
            staff.Last_Name__c            = (String) details.get('lastName');
             staff.Phone__c            = (String) details.get('phone');
            staff.Email__c                = email;
            staff.TSign_Organisation__c   = organisation.Id;
            staff.Address__Street__s      = fullAddress;
            staff.Address__City__s        = addressCity;
            staff.Address__StateCode__s   = addressState;
            staff.Address__PostalCode__s  = addressPostalCode;
            staff.Address__CountryCode__s = addressCountry;
            staff.User_Role__c            = role;
            staff.User_Type__c            = userType;
            insert staff;

            // 5. Staff-Facility junction.
            
            TSign_Staff_Facility__c staffFacility = new TSign_Staff_Facility__c();
            staffFacility.TSign_Staff__c    = staff.Id;
            staffFacility.TSign_Facility__c = facility.Id;
            staffFacility.Active__c=true;
            insert staffFacility;
            

            // 6. Contact for the portal User.
            Contact contactRecord = new Contact();
            contactRecord.FirstName              = (String) details.get('firstName');
            contactRecord.LastName               = (String) details.get('lastName');
            contactRecord.Email                  = email;
            contactRecord.AccountId              = accounts[0].Id;
            contactRecord.Portal_User_Created__c = true;
            contactRecord.MailingStreet          = fullAddress;
            contactRecord.MailingCity            = addressCity;
            contactRecord.MailingPostalCode      = addressPostalCode;
            contactRecord.User_Type__c            = userType;
                       // State/Country Picklists are not enabled in this org,
            // so MailingState/MailingCountry are plain text fields.
            contactRecord.MailingState           = addressState;     // e.g. NSW
            if (!String.isBlank(addressCountry)) {
                contactRecord.MailingCountry     = addressCountry;   // e.g. AU
            }
            insert contactRecord;

            // 7. Queue portal User creation. Runs in its own transaction after
            // this one commits; if anything above fails, the rollback below
            // also discards this job.
            Database.executeBatch( new TSignCreateUsersBatch(new Set<Id>{ contactRecord.Id }), 1);

            return 'TSign records created successfully. Portal User creation has been queued.';

        } catch (Exception e) {
            Database.rollback(sp);   // no half-created organisation/facility left behind

            System.debug(LoggingLevel.ERROR,
                'TSign registration failed: ' + e.getMessage() + '\n' + e.getStackTraceString());
            
            System.debug(LoggingLevel.ERROR,
                'TSign registration failed: ' + e.getMessage() + '\n' + e.getStackTraceString());
            
              try {
                String failedEmail = details != null && details.containsKey('email') ? (String) details.get('email') : 'Unknown';
                String orgName = 'Unknown Organisation';
                if (details != null) {
                    orgName = 'individual'.equalsIgnoreCase((String)details.get('accountType')) 
                        ? (String)details.get('firstName') + ' ' + (String)details.get('lastName')
                        : (String)details.get('organisationName');
                }

                // Insert the error record before the rollback executes
                TSign_Error_handling__c errorLog = new TSign_Error_handling__c(
                    Email__c = failedEmail,
                    Error_Message__c = 'TSign registration failed. Org: ' + orgName + '. Error: ' + e.getMessage()
                );
                insert errorLog;
                System.debug('✅ Error record inserted successfully.');
                
            } catch (Exception logEx) {
                System.debug(LoggingLevel.ERROR, 'Failed to insert error log: ' + logEx.getMessage());
            }

            // =========================================
            // NEW FAILURE EMAIL LOGIC
            // =========================================
            try {
                String failedEmail = details != null && details.containsKey('email') ? (String) details.get('email') : 'Unknown';
                String orgName = 'Unknown Organisation';
                if (details != null) {
                    orgName = 'individual'.equalsIgnoreCase((String)details.get('accountType')) 
                        ? (String)details.get('firstName') + ' ' + (String)details.get('lastName')
                        : (String)details.get('organisationName');
                }

                Map<String, Object> emailPayload = new Map<String, Object>();
                
                String fromEmailLabel = Label.TSign_Support_From_Email; 
                String toEmailLabel = Label.TSign_Support_To_Email;
                
                emailPayload.put('fromEmail', fromEmailLabel);
                
                // Note: If your custom label contains multiple emails separated by commas (e.g., "a@a.com,b@b.com"), 
                // you will need to split them into a list. If it's just one email, the code below handles it.
                emailPayload.put('toEmail', new List<String>{toEmailLabel});
                
                emailPayload.put('subject', 'ALERT: TSign User Creation FAILED');
                emailPayload.put('body', 
                                 'Hi Support Team,<br/><br/>' +
                                 'This is an automated notification to inform you that a recent TSign portal user registration has failed.<br/><br/>' +
                                 '<b>Candidate Details:</b><br/>' +
                                 '<b>• Email:</b> ' + failedEmail + '<br/>' +
                                 '<b>• Organisation:</b> ' + orgName + '<br/><br/>' +
                                 '<b>Error Details:</b><br/>' +
                                 '<span style="color: #d9534f;">' + e.getMessage() + '</span><br/><br/>' +
                                 'Please review the error logs and contact the candidate to assist them with their registration.<br/><br/>' +
                                 'Thanks and Regards,<br/>' +
                                 '<b>TSign System Administrator</b>'
                                );

                List<Object> bulkEmails = new List<Object>{ emailPayload };
                System.enqueueJob(new EmailRelayQueueable(bulkEmails));
                System.debug('✅ Failure email queued to support.');
            } catch (Exception emailEx) {
                System.debug(LoggingLevel.ERROR, 'Failed to queue failure email: ' + emailEx.getMessage());
            }

            throw new TSignRegistrationException(
                'TSign record creation failed: ' + e.getMessage(), e);
        }
    }
}