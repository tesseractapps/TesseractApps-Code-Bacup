@RestResource(urlMapping='/user/updateCancelSubscription/*')
global without sharing class TSignUpdateCancelSubscriptionAPI {
 
    @HttpPost
    global static void updateSubscription() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        
        res.addHeader('Content-Type', 'application/json');

        try {
            // 1. Parse the incoming JSON payload
            String requestBody = req.requestBody != null ? req.requestBody.toString() : '';
            if (String.isBlank(requestBody)) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'status' => 'error',
                    'message' => 'Request body is empty.'
                }));
                return;
            }

            Map<String, Object> details = (Map<String, Object>) JSON.deserializeUntyped(requestBody);
            String email = (String) details.get('email');

            if (String.isBlank(email)) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'status' => 'error',
                    'message' => 'Missing required parameter: email'
                }));
                return;
            }

            String cleanEmail = email.trim().toLowerCase();

            // 2. Fetch the Organisation by Email
            List<TSign_Organisation__c> orgList = [
                SELECT Id, Name ,Meta_Data_Deatils__c
                FROM TSign_Organisation__c 
                WHERE Email__c = :cleanEmail 
                LIMIT 1
            ];

            if (orgList.isEmpty()) {
                res.statusCode = 404;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'status' => 'error',
                    'message' => 'No TSign Organisation found with email: ' + cleanEmail
                }));
                return;
            }

            TSign_Organisation__c org = orgList[0];

            // 3. Deactivate existing Subscriptions (Assuming field is Active__c - change if your API name is different)
            List<TSign_Subscription__c> existingSubs = [
                SELECT Id , Active__c 
                FROM TSign_Subscription__c 
                WHERE TSign_Organisation__c = :org.Id 
               AND Active__c = true
            ];

            if (!existingSubs.isEmpty()) {
                for (TSign_Subscription__c sub : existingSubs) {
                     sub.Active__c = false; 
                }
                update existingSubs;
            }

            // 4. Create New Subscription Record
            TSign_Subscription__c newSub = new TSign_Subscription__c();
            newSub.TSign_Organisation__c = org.Id;
            newSub.Active__c = true;
            
            // Map fields from input
            newSub.Invoice_URL__c           = (String) details.get('invoiceUrl');
            newSub.Invoice_ID__c            = (String) details.get('invoiceId');
            newSub.Stripe_Invoice_Number__c = (String) details.get('invoiceNumber');
            newSub.Stripe_Price_ID__c       = (String) details.get('stripePriceId');
            newSub.Subscription_ID__c       = (String) details.get('subscriptionId');
            
            String invoiceAmtStr = (String) details.get('invoiceAmountPaid');
            if (String.isNotBlank(invoiceAmtStr)) {
                newSub.Invoice_Amount__c = Decimal.valueOf(invoiceAmtStr);
            }

            String periodEndStr = (String) details.get('currentPeriodEnd');
            String periodStartStr = (String) details.get('currentPeriodStart');
            
            if (String.isNotBlank(periodEndStr)) {
                newSub.Subscription_End_Date__c = Date.valueOf(periodEndStr.left(10)); 
            }
            if (String.isNotBlank(periodStartStr)) {
                newSub.Subscription_Start_Date__c = Date.valueOf(periodStartStr.left(10));
            }

            newSub.Date_Issued__c = Date.today();

            // Insert the new Subscription
            insert newSub;

            // 5. Update the Organisation Plan Start and End Dates
            if (String.isNotBlank(periodStartStr)) {
                org.Plan_Start_Date__c = Date.valueOf(periodStartStr.left(10)); 
            }
            if (String.isNotBlank(periodEndStr)) {
                org.Plan_End_Date__c = Date.valueOf(periodEndStr.left(10));
            }

            String status = (String) details.get('status');
            if (String.isNotBlank(status)) {
                org.Trial_Period__c = status == 'trialing';
            // } else if (newSub.Invoice_Amount__c != null && newSub.Invoice_Amount__c > 0) {
            //     org.Trial_Period__c = false;
                 org.Is_Cancelled__c = status == 'canceled';
           
            }
            // String priceId = (String) details.get('stripePriceId');
            // if (String.isNotBlank(priceId)) {
            //     org.Stripe_Price_ID__c = priceId;
            // }
            
            update org;

            // 6. Return Success Response
            res.statusCode = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, Object>{
                'status' => 'success',
                'message' => 'Subscription updated successfully.',
                'organisationId' => org.Id,
                'newSubscriptionId' => newSub.Id
            }));

        } catch (Exception e) {
            System.debug(LoggingLevel.ERROR, 'Subscription Update Failed: ' + e.getMessage() + '\n' + e.getStackTraceString());
            res.statusCode = 500;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'status' => 'error',
                'message' => 'An internal error occurred: ' + e.getMessage()
            }));
        }
    }
    
    @HttpPatch
    global static void cancelSubscription() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;

        res.addHeader('Content-Type', 'application/json');

        try {
            // 1. Parse the incoming JSON payload
            String requestBody = req.requestBody != null ? req.requestBody.toString() : '';
            System.debug('TSign web cancel - request ' + requestBody);
            if (String.isBlank(requestBody)) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'status' => 'error',
                    'message' => 'Request body is empty.'
                }));
                return;
            }

            Map<String, Object> details = (Map<String, Object>) JSON.deserializeUntyped(requestBody);
            String email = (String) details.get('email');
            String subscriptionId = (String) details.get('subscriptionId');
            String customerId = (String) details.get('customer');
            String status = (String) details.get('status');
            Boolean cancelAtPeriodEnd = Boolean.valueOf(String.valueOf(details.get('cancel_at_period_end')));
            Object canceledAt = details.get('canceled_at');
            Object cancelAt = details.get('cancel_at');
            String userEmail = (String) details.get('user_email');

            if (String.isBlank(email) || String.isBlank(subscriptionId) || String.isBlank(status)) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'status' => 'error',
                    'message' => 'Missing required parameter: email, subscriptionId and status are required'
                }));
                return;
            }

            String cleanEmail = email.trim().toLowerCase();

            // 2. Fetch the Organisation by Email
            List<TSign_Organisation__c> orgList = [
                SELECT Id, Name, Meta_Data_Deatils__c
                FROM TSign_Organisation__c
                WHERE Email__c = :cleanEmail
                LIMIT 1
            ];

            if (orgList.isEmpty()) {
                res.statusCode = 404;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'status' => 'error',
                    'message' => 'No TSign Organisation found with email: ' + cleanEmail
                }));
                return;
            }

            TSign_Organisation__c org = orgList[0];

            // 3. Action from the Stripe result: now (trial ended) / periodEnd (paid, ends at end date) / resume
            String action = status == 'canceled' ? 'now' : (cancelAtPeriodEnd ? 'periodEnd' : 'resume');
            System.debug('TSign web cancel - org=' + org.Id + ' | sub=' + subscriptionId + ' | status=' + status
                + ' | cancel_at_period_end=' + cancelAtPeriodEnd + ' | action=' + action);

            // 4. Update the Organisation (same as the app cancel)
            TSign_Organisation__c upd = new TSign_Organisation__c(Id = org.Id);
            upd.Is_Cancelled__c = action != 'resume';
            if (String.isNotBlank(customerId)) {
                upd.Stripe_Customer_ID__c = customerId;
            }
            if (status == 'canceled') {
                upd.Trial_Period__c = false;
                upd.Plan_End_Date__c = canceledAt != null
                    ? Datetime.newInstance(Long.valueOf(String.valueOf(canceledAt)) * 1000).date()
                    : Date.today();
            }

            // Meta_Data_Deatils__c: keep the existing JSON, add this cancel under "lastCancel"
            Map<String, Object> meta = new Map<String, Object>();
            Boolean canWriteMeta = true;
            if (String.isNotBlank(org.Meta_Data_Deatils__c)) {
                try {
                    Object parsed = JSON.deserializeUntyped(org.Meta_Data_Deatils__c);
                    if (parsed instanceof Map<String, Object>) {
                        meta = (Map<String, Object>) parsed;
                    } else {
                        canWriteMeta = false;
                    }
                } catch (Exception ex) {
                    canWriteMeta = false;
                }
            }
            if (canWriteMeta) {
                meta.put('lastCancel', new Map<String, Object>{
                    'action' => action,
                    'subscriptionId' => subscriptionId,
                    'status' => status,
                    'cancelAtPeriodEnd' => cancelAtPeriodEnd,
                    'canceledAt' => canceledAt,
                    'cancelAt' => cancelAt,
                    'changedAt' => String.valueOf(System.now()),
                    'changedBy' => 'web: ' + userEmail
                });
                upd.Meta_Data_Deatils__c = JSON.serialize(meta);
            }
            update upd;
            System.debug('TSign web cancel - TSign Organisation saved ' + JSON.serialize(upd));

            // 5. Trial cancelled now - deactivate active Subscriptions, end date = cancel date
            if (status == 'canceled') {
                List<TSign_Subscription__c> existingSubs = [
                    SELECT Id, Active__c
                    FROM TSign_Subscription__c
                    WHERE TSign_Organisation__c = :org.Id
                    AND Active__c = true
                ];
                if (!existingSubs.isEmpty()) {
                    for (TSign_Subscription__c sub : existingSubs) {
                        sub.Active__c = false;
                        sub.Subscription_End_Date__c = upd.Plan_End_Date__c;
                    }
                    update existingSubs;
                    System.debug('TSign web cancel - ' + existingSubs.size() + ' subscription record(s) set inactive');
                }
            }

            // 6. Return Success Response
            res.statusCode = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, Object>{
                'status' => 'success',
                'message' => action == 'resume' ? 'Subscription resumed successfully.' : 'Subscription cancelled successfully.',
                'action' => action,
                'organisationId' => org.Id
            }));

        } catch (Exception e) {
            System.debug(LoggingLevel.ERROR, 'TSign web cancel failed: ' + e.getMessage() + '\n' + e.getStackTraceString());
            res.statusCode = 500;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'status' => 'error',
                'message' => 'An internal error occurred: ' + e.getMessage()
            }));
        }
    }
    
}