public class TSignSubscriptionController {
	
     private static String replaceTrialSubscriptionId;

    @AuraEnabled(cacheable=true)
    public static List<Map<String, Object>> getPlans() {
        System.debug('TSign products START');
 
        // 1. Active products
        Map<String, Object> productsJson = callStripe('/v1/products?active=true&limit=100');
        List<Map<String, Object>> plans = new List<Map<String, Object>>();
        for (Object productObj : (List<Object>) productsJson.get('data')) {
            Map<String, Object> product = (Map<String, Object>) productObj;
            Map<String, Object> plan = new Map<String, Object>{
                'productId' => (String) product.get('id'),
                'productName' => (String) product.get('name'),
                'description' => (String) product.get('description'),
                'prices' => new List<Map<String, Object>>()
            };
            plans.add(plan);
            System.debug('TSign products PRODUCT ' + product.get('id') + ' | ' + product.get('name'));
        }
 
        // 2. >>> CHANGED: for each of those products only, its active recurring prices (monthly / yearly)
        for (Map<String, Object> plan : plans) {
            String productId = (String) plan.get('productId');
            // Map<String, Object> pricesJson = callStripe('/v1/prices?active=true&type=recurring&limit=10&product='
            //     + EncodingUtil.urlEncode(productId, 'UTF-8'));
            Map<String, Object> pricesJson = callStripe('/v1/prices?active=true&type=recurring&limit=10&product='
                + EncodingUtil.urlEncode(productId, 'UTF-8')
                + '&expand%5B%5D=data.currency_options');
             
            for (Object priceObj : (List<Object>) pricesJson.get('data')) {
                Map<String, Object> price = (Map<String, Object>) priceObj;
                Map<String, Object> recurring = (Map<String, Object>) price.get('recurring');
                Map<String, Object> priceInfo = new Map<String, Object>{
                    'priceId' => (String) price.get('id'),
                    'amount' => price.get('unit_amount') != null
                        ? Decimal.valueOf(String.valueOf(price.get('unit_amount'))) / 100 : null,
                    'currencyCode' => ((String) price.get('currency')).toUpperCase(),
                    'interval' => recurring != null ? (String) recurring.get('interval') : null,
                    'amountsByCurrency' => amountsByCurrency(price)  
                };
                ((List<Map<String, Object>>) plan.get('prices')).add(priceInfo);
                System.debug('TSign products PRICE ' + plan.get('productName') + ' | ' + JSON.serialize(priceInfo));
            }
        }
 
        System.debug('TSign products END - ' + plans.size() + ' products');
        return plans;
    }
 
   
    // @AuraEnabled
    // // public static Map<String, Object> getSubscriptionDetails() {
    //    public static Map<String, Object> getSubscriptionDetails(String subscriberEmail) {
    //     if (String.isBlank(subscriberEmail)) {
    //         System.debug('TSign sub START FAILED - no email passed from the page');
    //         throw new AuraHandledException('Organisation email is missing.');
    //     }
    //     String email = subscriberEmail.trim();
    //     System.debug('TSign sub START email=' + email);
 
    //     Map<String, Object> result = new Map<String, Object>{
    //         'subscriberEmail' => email,
    //         'foundBy' => 'none',
    //         'currentPlan' => null
    //     };
 
    //     // Step 1: User by subscriber email
    //     List<User> users = [
    //         SELECT Id, Name, Email, TSign_Org_Id__c
    //         FROM User
    //         WHERE Email = :email
    //         ORDER BY IsActive DESC, LastModifiedDate DESC
    //         LIMIT 1
    //     ];
    //     if (users.isEmpty()) {
    //         System.debug('TSign sub Step 1 FAILED - no User with email ' + email);
    //         throw new AuraHandledException('No Salesforce user found with email ' + email);
    //     }
    //     User u = users[0];
    //     result.put('userId', u.Id);
    //     result.put('userName', u.Name);
    //     System.debug('TSign sub Step 1 OK - User ' + u.Id + ' | ' + u.Name + ' | ' + u.Email);
 
    //     // Step 2: TSign Org Id on the User
    //     String orgId = u.TSign_Org_Id__c;
    //     result.put('orgId', orgId);
    //     System.debug('TSign sub Step 2 - TSign_Org_Id__c = ' + orgId);
 
    //     // Step 3: TSign Organisation record
    //     String orgEmail = null;
    //     String subscriptionId = null;
    //     if (String.isNotBlank(orgId)) {
    //         // LATER: add Stripe_Subscription_Id__c to this SELECT once the field exists
    //         List<TSign_Organisation__c> orgs = [
    //             SELECT Id, Name, Email__c
    //             FROM TSign_Organisation__c
    //             WHERE Id = :orgId
    //             LIMIT 1
    //         ];
    //         if (orgs.isEmpty()) {
    //             System.debug('TSign sub Step 3 - TSign Organisation ' + orgId + ' not found / not visible');
    //         } else {
    //             TSign_Organisation__c org = orgs[0];
    //             orgEmail = org.Email__c;
    //             // LATER: uncomment once Stripe_Subscription_Id__c exists
    //             // subscriptionId = org.Stripe_Subscription_Id__c;
    //             result.put('orgName', org.Name);
    //             System.debug('TSign sub Step 3 OK - ' + org.Name + ' | Email__c=' + orgEmail);
    //         }
    //     } else {
    //         System.debug('TSign sub Step 3 skipped - User has no TSign Org Id');
    //     }
 
    //     // Email used for Stripe: the TSign Organisation email, else the subscriber email
    //     String lookupEmail = String.isNotBlank(orgEmail) ? orgEmail : email;
    //     result.put('orgEmail', orgEmail);
    //     result.put('subscriptionId', subscriptionId);
    //     result.put('lookupEmail', lookupEmail);
    //     System.debug('TSign sub Stripe lookup email = ' + lookupEmail);
 
    //     Set<String> currentStatuses = new Set<String>{ 'active', 'trialing', 'past_due', 'unpaid', 'paused' };
 
    //     Map<String, Object> currentSub = null;
 
    //     // Step 4a: subscription id + email
    //     // LATER: uncomment this block once Stripe_Subscription_Id__c exists and has values
    //     /*
    //     if (String.isNotBlank(subscriptionId)) {
    //         try {
    //             Map<String, Object> sub = callStripe('/v1/subscriptions/' + EncodingUtil.urlEncode(subscriptionId, 'UTF-8')
    //                 + '?expand%5B%5D=customer');
    //             Map<String, Object> customer = (Map<String, Object>) sub.get('customer');
    //             String customerEmail = customer != null ? (String) customer.get('email') : null;
    //             String status = (String) sub.get('status');
    //             System.debug('TSign sub Step 4a - subscription ' + subscriptionId + ' status=' + status
    //                 + ' | customer email=' + customerEmail);
 
    //             if (String.isBlank(customerEmail) || !customerEmail.equalsIgnoreCase(lookupEmail)) {
    //                 System.debug('TSign sub Step 4a - email does NOT match (' + customerEmail + ' vs ' + lookupEmail
    //                     + ') - falling back to email only');
    //             } else if (currentStatuses.contains(status)) {
    //                 currentSub = sub;
    //                 result.put('foundBy', 'subscriptionId+email');
    //                 result.put('customerId', customer.get('id'));
    //             } else {
    //                 System.debug('TSign sub Step 4a - subscription is ' + status + ', not current - checking by email');
    //             }
    //         } catch (Exception ex) {
    //             System.debug('TSign sub Step 4a FAILED - ' + ex.getMessage() + ' - falling back to email only');
    //         }
    //     }
    //     */
 
    //     // Step 4b: email only
    //     if (currentSub == null && String.isNotBlank(lookupEmail)) {
    //         Map<String, Object> customers = callStripe('/v1/customers?limit=10&email=' + EncodingUtil.urlEncode(lookupEmail, 'UTF-8'));
    //         List<Object> customerList = (List<Object>) customers.get('data');
    //         System.debug('TSign sub Step 4b - Stripe customers with email ' + lookupEmail + ': ' + customerList.size());
 
    //         for (Object custObj : customerList) {
    //             Map<String, Object> customer = (Map<String, Object>) custObj;
    //             // currency Stripe saved on this customer (kept even after a subscription ends)
    //             if (result.get('customerCurrency') == null && String.isNotBlank((String) customer.get('currency'))) {
    //                 result.put('customerCurrency', ((String) customer.get('currency')).toUpperCase());
    //             }
    //             Map<String, Object> subs = callStripe('/v1/subscriptions?status=all&limit=20&customer='
    //                 + EncodingUtil.urlEncode((String) customer.get('id'), 'UTF-8'));
    //             // Map<String, Object> subs = callStripe('/v1/subscriptions?status=all&limit=20&customer='
    //             //     + EncodingUtil.urlEncode((String) customer.get('id'), 'UTF-8')
    //             //     + '&expand%5B%5D=data.items.data.price.currency_options');
    //             for (Object subObj : (List<Object>) subs.get('data')) {
    //                 Map<String, Object> sub = (Map<String, Object>) subObj;
    //                 String status = (String) sub.get('status');
    //                 System.debug('TSign sub Step 4b - customer ' + customer.get('id') + ' | subscription ' + sub.get('id')
    //                     + ' | status=' + status);
    //                 if (currentSub == null && currentStatuses.contains(status)) {
    //                     currentSub = sub;
    //                     result.put('foundBy', 'email');
    //                     result.put('customerId', customer.get('id'));
    //                 }
    //             }
    //         }
    //     }
 
    //     // Step 5: current plan summary
    //     if (currentSub != null) {
    //         // Map<String, Object> items = (Map<String, Object>) currentSub.get('items');
    //         // Map<String, Object> item = (Map<String, Object>) ((List<Object>) items.get('data'))[0];
    //         // Map<String, Object> price = (Map<String, Object>) item.get('price');
    //         Map<String, Object> items = (Map<String, Object>) currentSub.get('items');
    //         Map<String, Object> item = (Map<String, Object>) ((List<Object>) items.get('data'))[0];
    //         Map<String, Object> itemPrice = (Map<String, Object>) item.get('price');

    //         // >>> NEW: get this price again with its other currencies (1 level expand - allowed)
    //         Map<String, Object> price = callStripe('/v1/prices/'
    //             + EncodingUtil.urlEncode((String) itemPrice.get('id'), 'UTF-8')
    //             + '?expand%5B%5D=currency_options');
    //         System.debug('TSign sub Step 5 - subscription currency=' + currentSub.get('currency')
    //             + ' | price default currency=' + price.get('currency'));
    //         // newer Stripe API versions keep the period on the item, older ones on the subscription
    //         Object periodEnd = item.get('current_period_end') != null ? item.get('current_period_end') : currentSub.get('current_period_end');
    //         Map<String, Object> currentPlan = new Map<String, Object>{
    //             'subscriptionId' => currentSub.get('id'),
    //             'status' => currentSub.get('status'),
    //             'priceId' => price.get('id'),
    //             'productId' => price.get('product'),   // >>> NEW: product id, used to mark the current product
    //             // >>> NEW: the price actually being paid (may differ from the product's default price)
    //             // 'amount' => price.get('unit_amount') != null ? Decimal.valueOf(String.valueOf(price.get('unit_amount'))) / 100 : null,
    //             // 'currencyCode' => price.get('currency') != null ? ((String) price.get('currency')).toUpperCase() : null,
    //             // 'interval' => price.get('recurring') != null ? ((Map<String, Object>) price.get('recurring')).get('interval') : null,
    //             'amount' => amountIn(price, (String) currentSub.get('currency')),
    //             'currencyCode' => ((String) currentSub.get('currency')).toUpperCase(),
    //             'interval' => price.get('recurring') != null ? ((Map<String, Object>) price.get('recurring')).get('interval') : null,
    //             'quantity' => item.get('quantity'),
    //             'trialEnd' => currentSub.get('trial_end'),
    //             'currentPeriodEnd' => periodEnd,
    //             'cancelAtPeriodEnd' => currentSub.get('cancel_at_period_end')
    //         };
    //         result.put('currentPlan', currentPlan);
    //         result.put('customerCurrency', ((String) currentSub.get('currency')).toUpperCase());
    //         System.debug('TSign sub Step 5 - CURRENT PLAN: ' + JSON.serialize(currentPlan));
    //     } else {
    //         System.debug('TSign sub Step 5 - no current plan, show all active plans');
    //     }
 
    //     System.debug('TSign sub END result=' + JSON.serialize(result));
    //     return result;
    // }
     @AuraEnabled
    public static Map<String, Object> getSubscriptionDetails(String subscriberEmail, String stripeCustomerId) {
        String email = (String.isNotBlank(subscriberEmail) && subscriberEmail != '-') ? subscriberEmail.trim() : null;
        String customerId = String.isNotBlank(stripeCustomerId) ? stripeCustomerId.trim() : null;
        System.debug('TSign sub START email=' + email + ' | stripeCustomerId=' + customerId);

        if (email == null) {
            throw new AuraHandledException('Organisation email is missing.');
        }

        Map<String, Object> result = new Map<String, Object>{
            'subscriberEmail' => email,
            'lookupEmail' => email,
            'savedCustomerId' => customerId,
            'foundBy' => 'none',
            'currentPlan' => null
        };

        Set<String> currentStatuses = new Set<String>{ 'active', 'trialing', 'past_due', 'unpaid', 'paused' };
        Map<String, Object> customer = null;

        // Step 1: Stripe customer by Stripe_Customer_ID__c - its email must match
        if (customerId != null) {
            Map<String, Object> stripeCustomer = callStripe('/v1/customers/' + EncodingUtil.urlEncode(customerId, 'UTF-8'));
            String customerEmail = (String) stripeCustomer.get('email');
            System.debug('TSign sub Step 1 - customer ' + customerId + ' | Stripe email=' + customerEmail + ' | page email=' + email);
            // if (stripeCustomer.get('deleted') != true && String.isNotBlank(customerEmail)
            //         && customerEmail.equalsIgnoreCase(email)) {
            //     customer = stripeCustomer;
            //     result.put('foundBy', 'customerId+email');
            // } else {
            //     System.debug('TSign sub Step 1 - customer deleted or email does NOT match - no plan shown');
            // }
            Boolean emailMatches = String.isNotBlank(customerEmail) && customerEmail.equalsIgnoreCase(email);
            if (stripeCustomer.get('deleted') == true) {
                System.debug('TSign sub Step 1 - customer ' + customerId + ' is deleted in Stripe - no plan shown');
            } else if (emailMatches) {
                customer = stripeCustomer;
                result.put('foundBy', 'customerId+email');
            } else {
                // customer id comes from our own TSign Organisation record - use it, but log the email difference
                customer = stripeCustomer;
                result.put('foundBy', 'customerId');
                result.put('emailMismatch', true);
                System.debug('TSign sub Step 1 - WARNING email differs (Stripe=' + customerEmail + ' | org=' + email
                    + ') - customer id from the org record used');
            }
        } else {
            // only when the record has no Stripe_Customer_ID__c yet (before the first saved payment)
            Map<String, Object> customers = callStripe('/v1/customers?limit=1&email=' + EncodingUtil.urlEncode(email, 'UTF-8'));
            List<Object> customerList = (List<Object>) customers.get('data');
            System.debug('TSign sub Step 1 - no Stripe_Customer_ID__c, customers by email: ' + customerList.size());
            if (!customerList.isEmpty()) {
                customer = (Map<String, Object>) customerList[0];
                result.put('foundBy', 'email');
            }
        }

        // Step 2: that customer's subscriptions - first current one
        Map<String, Object> currentSub = null;
        Map<String, Object> lastSub = null;   // latest cancelled subscription - for Renew
        if (customer != null) {
            result.put('customerId', customer.get('id'));
            if (customer.get('balance') != null) {
                Decimal balance = Decimal.valueOf(String.valueOf(customer.get('balance'))) / 100;
                if (balance < 0) {
                    result.put('creditBalance', -balance);
                }
            }
            if (String.isNotBlank((String) customer.get('currency'))) {
                result.put('customerCurrency', ((String) customer.get('currency')).toUpperCase());
            }
            Map<String, Object> subs = callStripe('/v1/subscriptions?status=all&limit=20&customer='
                + EncodingUtil.urlEncode((String) customer.get('id'), 'UTF-8'));
            for (Object subObj : (List<Object>) subs.get('data')) {
                Map<String, Object> sub = (Map<String, Object>) subObj;
                String status = (String) sub.get('status');
                System.debug('TSign sub Step 2 - subscription ' + sub.get('id') + ' | status=' + status);
                if (currentSub == null && currentStatuses.contains(status)) {
                    currentSub = sub;
                }
                if (lastSub == null && status == 'canceled') {
                    lastSub = sub;   // Stripe lists newest first
                }
            }
        }

        // Step 3: current plan summary
        if (currentSub != null) {
            Map<String, Object> items = (Map<String, Object>) currentSub.get('items');
            Map<String, Object> item = (Map<String, Object>) ((List<Object>) items.get('data'))[0];
            Map<String, Object> itemPrice = (Map<String, Object>) item.get('price');

            // price again with its other currencies (1-level expand)
            Map<String, Object> price = callStripe('/v1/prices/'
                + EncodingUtil.urlEncode((String) itemPrice.get('id'), 'UTF-8')
                + '?expand%5B%5D=currency_options');
            Object periodEnd = item.get('current_period_end') != null ? item.get('current_period_end') : currentSub.get('current_period_end');
            Map<String, Object> currentPlan = new Map<String, Object>{
                'subscriptionId' => currentSub.get('id'),
                'status' => currentSub.get('status'),
                'priceId' => price.get('id'),
                'productId' => price.get('product'),
                'amount' => amountIn(price, (String) currentSub.get('currency')),
                'currencyCode' => ((String) currentSub.get('currency')).toUpperCase(),
                'interval' => price.get('recurring') != null ? ((Map<String, Object>) price.get('recurring')).get('interval') : null,
                'quantity' => item.get('quantity'),
                'trialEnd' => currentSub.get('trial_end'),
                'currentPeriodEnd' => periodEnd,
                'cancelAtPeriodEnd' => currentSub.get('cancel_at_period_end')
            };
            result.put('currentPlan', currentPlan);
            result.put('customerCurrency', ((String) currentSub.get('currency')).toUpperCase());
            System.debug('TSign sub Step 3 - CURRENT PLAN: ' + JSON.serialize(currentPlan));
        } else {
            System.debug('TSign sub Step 3 - no current plan, show all active plans');
        }

        // Step 4: no current plan - last cancelled plan, so the page can offer Renew
        if (currentSub == null && lastSub != null) {
            Map<String, Object> lastItems = (Map<String, Object>) lastSub.get('items');
            List<Object> lastItemList = lastItems != null ? (List<Object>) lastItems.get('data') : null;
            if (lastItemList != null && !lastItemList.isEmpty()) {
                Map<String, Object> lastItem = (Map<String, Object>) lastItemList[0];
                Map<String, Object> lastPrice = (Map<String, Object>) lastItem.get('price');
                Map<String, Object> lastRecurring = lastPrice != null ? (Map<String, Object>) lastPrice.get('recurring') : null;
                Map<String, Object> lastPlan = new Map<String, Object>{
                    'subscriptionId' => lastSub.get('id'),
                    'priceId' => lastPrice != null ? lastPrice.get('id') : null,
                    'productId' => lastPrice != null ? lastPrice.get('product') : null,
                    'interval' => lastRecurring != null ? lastRecurring.get('interval') : null,
                    'quantity' => lastItem.get('quantity'),
                    'endedAt' => lastSub.get('ended_at') != null ? lastSub.get('ended_at') : lastSub.get('canceled_at')
                };
                result.put('lastPlan', lastPlan);
                System.debug('TSign sub Step 4 - LAST CANCELLED PLAN: ' + JSON.serialize(lastPlan));
            }
        }

        System.debug('TSign sub END result=' + JSON.serialize(result));
        return result;
    }
      @AuraEnabled
    public static String createUpgradeCheckout(String priceId, String returnUrl, String subscriberEmail,String stripeCustomerId, String orgRecordId, String businessDetails) {
        System.debug('TSign checkout START priceId=' + priceId + ' | returnUrl=' + returnUrl);
        System.debug('TSign checkout START subscriberEmail=' + subscriberEmail + ' | stripeCustomerId=' + stripeCustomerId  + ' | orgRecordId=' + orgRecordId);
        if (String.isBlank(priceId) || !priceId.startsWith('price_')) {
            throw new AuraHandledException('Invalid Stripe price id: ' + priceId);
        }
        if (String.isBlank(returnUrl)) {
            throw new AuraHandledException('Return URL is missing.');

        }
        // Business popup details (empty for non-business plans) - team size = Stripe quantity
        Map<String, Object> biz = String.isNotBlank(businessDetails)
            ? (Map<String, Object>) JSON.deserializeUntyped(businessDetails) : new Map<String, Object>();
        Integer quantity = 1;
        if (biz.get('teamSize') != null && String.isNotBlank(String.valueOf(biz.get('teamSize')))) {
            quantity = Math.max(1, Integer.valueOf(String.valueOf(biz.get('teamSize'))));
        }
        System.debug('TSign checkout business details=' + JSON.serialize(biz) + ' | quantity=' + quantity);
      

        //  // Same lookup as the page: reuse the existing Stripe customer if there is one
        // Map<String, Object> details = getSubscriptionDetails(subscriberEmail, stripeCustomerId);
        // String customerId = (String) details.get('customerId');
        // String lookupEmail = (String) details.get('lookupEmail');
        // System.debug('TSign checkout customerId=' + customerId + ' | lookupEmail=' + lookupEmail);
        Map<String, Object> details = getSubscriptionDetails(subscriberEmail, stripeCustomerId);
        String customerId = (String) details.get('customerId');
        String lookupEmail = (String) details.get('lookupEmail');
        System.debug('TSign checkout customerId=' + customerId + ' | lookupEmail=' + lookupEmail);

        // one subscription per customer - a current one is updated (startPlanChange), never a second one created
        //if (details.get('currentPlan') != null) {
        if (details.get('currentPlan') != null && String.isBlank(replaceTrialSubscriptionId)) {
            System.debug('TSign checkout BLOCKED - customer already has a current subscription '
                + ((Map<String, Object>) details.get('currentPlan')).get('subscriptionId'));
            String msg = 'You already have an active subscription. Please change your plan instead of starting a new one.';
            AuraHandledException ae = new AuraHandledException(msg);
            ae.setMessage(msg);
            throw ae;
        }

        // Currency: use the customer's existing currency (Stripe allows only one per customer),
        // otherwise the price's own currency
        Map<String, Object> priceJson = callStripe('/v1/prices/' + EncodingUtil.urlEncode(priceId, 'UTF-8'));
        String priceCurrency = (String) priceJson.get('currency');
        if (String.isNotBlank(customerId)) {
            Map<String, Object> customerJson = callStripe('/v1/customers/' + EncodingUtil.urlEncode(customerId, 'UTF-8'));
            String customerCurrency = (String) customerJson.get('currency');
            System.debug('TSign checkout customer currency=' + customerCurrency + ' | price currency=' + priceCurrency);
            // if (String.isNotBlank(customerCurrency)) {
            //     priceCurrency = customerCurrency;
            // }
            if (String.isBlank(customerCurrency) && details.get('customerCurrency') != null) {
                customerCurrency = ((String) details.get('customerCurrency')).toLowerCase();
            }
            if (String.isNotBlank(customerCurrency)) {
                priceCurrency = customerCurrency;
            }

            // Expire old unpaid Checkout sessions of this customer so they can't block this one
            Map<String, Object> openSessions = callStripe('/v1/checkout/sessions?status=open&limit=10&customer='
                + EncodingUtil.urlEncode(customerId, 'UTF-8'));
            for (Object sessionObj : (List<Object>) openSessions.get('data')) {
                String openId = (String) ((Map<String, Object>) sessionObj).get('id');
                postStripe('/v1/checkout/sessions/' + openId + '/expire', '');
                System.debug('TSign checkout expired old open session ' + openId);
            }
        }
        System.debug('TSign checkout currency used=' + priceCurrency);

        String successUrl = returnUrl + '?stripe=success&session_id={CHECKOUT_SESSION_ID}';
        String cancelUrl = returnUrl + '?stripe=cancel';

        String body =
            'mode=subscription' +
            '&line_items[0][price]=' + EncodingUtil.urlEncode(priceId, 'UTF-8') +
            //'&line_items[0][quantity]=1' +
            '&line_items[0][quantity]=' + quantity +
            //'&client_reference_id=' + details.get('userId') +
            '&client_reference_id=' + orgRecordId +
            '&payment_method_collection=always' +
            '&success_url=' + EncodingUtil.urlEncode(successUrl, 'UTF-8') +
            '&cancel_url=' + EncodingUtil.urlEncode(cancelUrl, 'UTF-8') +
            // '&metadata[sfUserId]=' + details.get('userId') +
            // //'&subscription_data[metadata][sfUserId]=' + details.get('userId');
            // '&subscription_data[metadata][sfUserId]=' + details.get('userId') +
            '&metadata[tsignOrgId]=' + orgRecordId +
            '&metadata[sfUserId]=' + UserInfo.getUserId() +
            '&subscription_data[metadata][tsignOrgId]=' + orgRecordId +
            '&subscription_data[metadata][sfUserId]=' + UserInfo.getUserId() +
            '&currency=' + priceCurrency +            // >>> NEW: same currency as the page (e.g. usd)
            '&adaptive_pricing[enabled]=false'; 

        if (String.isNotBlank(replaceTrialSubscriptionId)) {
            body += '&metadata[replaceSubscriptionId]=' + EncodingUtil.urlEncode(replaceTrialSubscriptionId, 'UTF-8');
        }
        if (String.isNotBlank(customerId)) {
            body += '&customer=' + EncodingUtil.urlEncode(customerId, 'UTF-8');          // existing Stripe customer          // existing Stripe customer
        } else {
            body += '&customer_email=' + EncodingUtil.urlEncode(lookupEmail, 'UTF-8');   // new customer by email
        }
         for (String key : biz.keySet()) {
            String value = biz.get(key) != null ? String.valueOf(biz.get(key)).trim() : '';
            if (String.isNotBlank(value)) {
                body += '&metadata[biz_' + key + ']=' + EncodingUtil.urlEncode(value.left(500), 'UTF-8');
            }
        }
        for (String pair : body.split('&')) {
            System.debug('TSign checkout body ' + EncodingUtil.urlDecode(pair, 'UTF-8'));
        }

        Map<String, Object> session = postStripe('/v1/checkout/sessions', body);
        String checkoutUrl = (String) session.get('url');
        System.debug('TSign checkout END session=' + session.get('id') + ' | url=' + checkoutUrl);
        return checkoutUrl;
    }
    
    // >>> NEW: after a successful checkout - get EVERYTHING Stripe saved for it, with all metadata
    @AuraEnabled
    public static Map<String, Object> getCheckoutResult(String sessionId, String orgRecordId) {
        System.debug('TSign result START sessionId=' + sessionId);

        if (String.isBlank(sessionId) || !sessionId.startsWith('cs_')) {
            throw new AuraHandledException('Invalid Stripe session id: ' + sessionId);
        }
        
        // // back from the "save a card" page (setup mode) - update the current subscription, no new subscription
        // Map<String, Object> sessionHead = callStripe('/v1/checkout/sessions/' + EncodingUtil.urlEncode(sessionId, 'UTF-8')
        //     + '?expand%5B%5D=setup_intent');
        // if (sessionHead.get('mode') == 'setup') {
        //     return finishPlanChangeAfterCard(sessionHead, orgRecordId);
        // }

        // 1. Checkout session with everything linked to it
        Map<String, Object> session = callStripe('/v1/checkout/sessions/' + EncodingUtil.urlEncode(sessionId, 'UTF-8')
            + '?expand%5B%5D=subscription'
            + '&expand%5B%5D=subscription.default_payment_method'
            + '&expand%5B%5D=customer'
            + '&expand%5B%5D=invoice'
            + '&expand%5B%5D=line_items.data.price.product');

        Map<String, Object> subscription = (Map<String, Object>) session.get('subscription');
        Map<String, Object> customer = (Map<String, Object>) session.get('customer');
        Map<String, Object> invoice = (Map<String, Object>) session.get('invoice');
        Map<String, Object> lineItems = (Map<String, Object>) session.get('line_items');

        // 2. Price + product of the new subscription
        Map<String, Object> price = null;
        Map<String, Object> product = null;
        if (lineItems != null && !((List<Object>) lineItems.get('data')).isEmpty()) {
            Map<String, Object> line = (Map<String, Object>) ((List<Object>) lineItems.get('data'))[0];
            price = (Map<String, Object>) line.get('price');
            product = price != null ? (Map<String, Object>) price.get('product') : null;
        }

        // 3. Invoice of the subscription if the session didn't carry one
        if (invoice == null && subscription != null && subscription.get('latest_invoice') != null) {
            invoice = callStripe('/v1/invoices/' + EncodingUtil.urlEncode((String) subscription.get('latest_invoice'), 'UTF-8'));
        }

        // 4. All metadata in one place
        Map<String, Object> allMetadata = new Map<String, Object>{
            'session' => session.get('metadata'),
            'subscription' => subscription != null ? subscription.get('metadata') : null,
            'customer' => customer != null ? customer.get('metadata') : null,
            'price' => price != null ? price.get('metadata') : null,
            'product' => product != null ? product.get('metadata') : null,
            'invoice' => invoice != null ? invoice.get('metadata') : null
        };

        System.debug('TSign result session status=' + session.get('status') + ' | payment_status=' + session.get('payment_status'));
        System.debug('TSign result subscription=' + (subscription != null ? subscription.get('id') + ' | status=' + subscription.get('status') : 'none'));
        System.debug('TSign result customer=' + (customer != null ? customer.get('id') + ' | ' + customer.get('email') : 'none'));
        System.debug('TSign result ALL METADATA=' + JSON.serializePretty(allMetadata));

        System.debug('TSign FULL SESSION ' + JSON.serializePretty(session));
        System.debug('TSign FULL SUBSCRIPTION ' + JSON.serializePretty(subscription));
        System.debug('TSign FULL CUSTOMER ' + JSON.serializePretty(customer));
        System.debug('TSign FULL INVOICE ' + JSON.serializePretty(invoice));
        System.debug('TSign FULL PRICE ' + JSON.serializePretty(price));
        System.debug('TSign FULL PRODUCT ' + JSON.serializePretty(product));
        // 5. Full Stripe objects + metadata summary
        Map<String, Object> result = new Map<String, Object>{
            'session' => session,
            'subscription' => subscription,
            'customer' => customer,
            'invoice' => invoice,
            'price' => price,
            'product' => product,
            'allMetadata' => allMetadata
        };
        // if (session.get('status') == 'complete') {
        //     result.put('savedOrgId', saveCheckoutToOrg(orgRecordId, session, subscription, customer, price, product, invoice, allMetadata));
        if (session.get('status') == 'complete') {
            // popup details -> Stripe customer (callouts must run before the DML in saveCheckoutToOrg)
            Map<String, Object> sessionMeta = (Map<String, Object>) session.get('metadata');
            Map<String, Object> biz = new Map<String, Object>();
            if (sessionMeta != null) {
                for (String key : sessionMeta.keySet()) {
                    if (key.startsWith('biz_')) {
                        biz.put(key.removeStart('biz_'), sessionMeta.get(key));
                    }
                }
            }

            // upgraded from a trial - end the trial subscription now, so only the new paid one stays
            String replaceId = sessionMeta != null ? (String) sessionMeta.get('replaceSubscriptionId') : null;
            if (String.isNotBlank(replaceId) && (subscription == null || replaceId != (String) subscription.get('id'))) {
                try {
                    sendStripe('DELETE', '/v1/subscriptions/' + EncodingUtil.urlEncode(replaceId, 'UTF-8'), null);
                    System.debug('TSign result - trial subscription ' + replaceId + ' ended, replaced by ' + subscription.get('id'));
                } catch (Exception ex) {
                    System.debug('TSign result - trial subscription ' + replaceId + ' not ended: ' + ex.getMessage());
                }
            }
            if (!biz.isEmpty() && customer != null) {
                updateStripeCustomer((String) customer.get('id'), biz);
            }
            //result.put('savedOrgId', saveCheckoutToOrg(orgRecordId, session, subscription, customer, price, product, invoice, allMetadata));
                        Id savedOrgId = saveCheckoutToOrg(orgRecordId, session, subscription, customer, price, product, invoice, allMetadata);
            result.put('savedOrgId', savedOrgId);
            // account type after the save - the dashboard switches My Profile <-> My Organisation with it
            if (savedOrgId != null) {
                result.put('accountType', [SELECT Account_Type__c FROM TSign_Organisation__c WHERE Id = :savedOrgId].Account_Type__c);
                System.debug('TSign result - account type after save=' + result.get('accountType'));
            }
        } else {
            System.debug('TSign result - session not complete (' + session.get('status') + '), nothing saved');
        }
       
        System.debug('TSign result END');
        return result;
    }

        // ================================================================ One active subscription per customer

       @AuraEnabled
    public static Map<String, Object> startPlanChange(String priceId, String returnUrl, String subscriberEmail,
            String stripeCustomerId, String orgRecordId, String businessDetails) {
        System.debug('TSign plan change START priceId=' + priceId + ' | org=' + orgRecordId + ' | business=' + businessDetails);
        if (String.isBlank(priceId) || !priceId.startsWith('price_')) {
            throw new AuraHandledException('Invalid Stripe price id: ' + priceId);
        }
        // same lookup as the page - only this organisation's own subscription is used (never an id from the browser)
        Map<String, Object> details = getSubscriptionDetails(subscriberEmail, stripeCustomerId);
        Map<String, Object> currentPlan = (Map<String, Object>) details.get('currentPlan');

        // 1. no current subscription - new one through Checkout (old cancelled one stays cancelled)
        if (currentPlan == null) {
            System.debug('TSign plan change - no current subscription, new subscription through Checkout');
            return new Map<String, Object>{
                'mode' => 'checkout',
                'url' => createUpgradeCheckout(priceId, returnUrl, subscriberEmail, stripeCustomerId, orgRecordId, businessDetails)
            };
        }

        String customerId = (String) details.get('customerId');
        String subscriptionId = (String) currentPlan.get('subscriptionId');

        // 2. trial - card is entered on Checkout, the paid plan starts, the trial subscription is ended after payment
        if (currentPlan.get('status') == 'trialing') {
            System.debug('TSign plan change - trial ' + subscriptionId + ' -> paid plan through Checkout');
            replaceTrialSubscriptionId = subscriptionId;
            return new Map<String, Object>{
                'mode' => 'checkout',
                'url' => createUpgradeCheckout(priceId, returnUrl, subscriberEmail, stripeCustomerId, orgRecordId, businessDetails)
            };
        }

        // 3. paid subscription - Stripe "confirm plan change" page for the SAME subscription (shows the prorated amount)
        Map<String, Object> biz = String.isNotBlank(businessDetails)
            ? (Map<String, Object>) JSON.deserializeUntyped(businessDetails) : new Map<String, Object>();
        Map<String, Object> sub = callStripe('/v1/subscriptions/' + EncodingUtil.urlEncode(subscriptionId, 'UTF-8'));
        Map<String, Object> items = (Map<String, Object>) sub.get('items');
        Map<String, Object> item = (Map<String, Object>) ((List<Object>) items.get('data'))[0];
        Map<String, Object> price = callStripe('/v1/prices/' + EncodingUtil.urlEncode(priceId, 'UTF-8') + '?expand%5B%5D=product');
        Map<String, Object> product = (Map<String, Object>) price.get('product');

        // users: team size from the business popup, Individual = 1, else keep the current number
        Integer quantity = item.get('quantity') != null ? Integer.valueOf(String.valueOf(item.get('quantity'))) : 1;
        if (biz.get('teamSize') != null && String.isNotBlank(String.valueOf(biz.get('teamSize')))) {
            quantity = Math.max(1, Integer.valueOf(String.valueOf(biz.get('teamSize'))));
        } else if (product != null && String.valueOf(product.get('name')).containsIgnoreCase('individual')) {
            quantity = 1;
        }

        String token = EncodingUtil.convertToHex(Crypto.generateAesKey(128)).left(20);
        String body = 'customer=' + EncodingUtil.urlEncode(customerId, 'UTF-8')
            + '&return_url=' + EncodingUtil.urlEncode(returnUrl + '?stripe=cancel', 'UTF-8')
            + '&flow_data[type]=subscription_update_confirm'
            + '&flow_data[subscription_update_confirm][subscription]=' + EncodingUtil.urlEncode(subscriptionId, 'UTF-8')
            + '&flow_data[subscription_update_confirm][items][0][id]=' + EncodingUtil.urlEncode((String) item.get('id'), 'UTF-8')
            + '&flow_data[subscription_update_confirm][items][0][price]=' + EncodingUtil.urlEncode(priceId, 'UTF-8')
            + '&flow_data[subscription_update_confirm][items][0][quantity]=' + quantity
            + '&flow_data[after_completion][type]=redirect'
            + '&flow_data[after_completion][redirect][return_url]='
                + EncodingUtil.urlEncode(returnUrl + '?stripe=updated&change=' + token, 'UTF-8');
        Map<String, Object> portal = postStripe('/v1/billing_portal/sessions', body);
        System.debug('TSign plan change - confirm page ' + portal.get('id') + ' | subscription ' + subscriptionId
            + ' | price ' + priceId + ' | quantity ' + quantity);

        // remember what was asked - checked and saved when the customer comes back (DML after the callouts)
        savePendingChange(orgRecordId, new Map<String, Object>{
            'token' => token,
            'subscriptionId' => subscriptionId,
            'priceId' => priceId,
            'quantity' => quantity,
            'businessDetails' => biz,
            'createdAt' => String.valueOf(System.now())
        });
        return new Map<String, Object>{ 'mode' => 'checkout', 'url' => portal.get('url') };
    }

    // Back from the Stripe confirm page - check Stripe really changed the plan, then save like a payment
    @AuraEnabled
    public static Map<String, Object> completePlanChange(String orgRecordId, String token) {
        System.debug('TSign plan change complete START org=' + orgRecordId + ' | token=' + token);
        Map<String, Object> result = new Map<String, Object>{ 'changed' => false };
        if (String.isBlank(orgRecordId) || String.isBlank(token)) {
            return result;
        }
        List<TSign_Organisation__c> orgs = [
            SELECT Id, Meta_Data_Deatils__c FROM TSign_Organisation__c WHERE Id = :orgRecordId LIMIT 1
        ];
        if (orgs.isEmpty()) {
            return result;
        }
        Map<String, Object> meta = readMeta(orgs[0].Meta_Data_Deatils__c);
        Map<String, Object> pending = meta != null ? (Map<String, Object>) meta.get('pendingPlanChange') : null;
        if (pending == null || pending.get('token') != token) {
            System.debug('TSign plan change complete - no pending change with this token, nothing saved');
            return result;
        }
        String subscriptionId = (String) pending.get('subscriptionId');
        String priceId = (String) pending.get('priceId');
        Map<String, Object> biz = pending.get('businessDetails') != null
            ? (Map<String, Object>) pending.get('businessDetails') : new Map<String, Object>();

        // 1. Stripe (all callouts first): is the new price really on the subscription?
        String path = '/v1/subscriptions/' + EncodingUtil.urlEncode(subscriptionId, 'UTF-8');
        Map<String, Object> sub = callStripe(path);
        Map<String, Object> items = (Map<String, Object>) sub.get('items');
        Map<String, Object> item = (Map<String, Object>) ((List<Object>) items.get('data'))[0];
        String currentPriceId = (String) ((Map<String, Object>) item.get('price')).get('id');
        if (currentPriceId != priceId || sub.get('pending_update') != null) {
            System.debug('TSign plan change complete - Stripe still has ' + currentPriceId
                + ' (asked ' + priceId + ') | pending_update=' + sub.get('pending_update') + ' - not saved');
            return result;
        }
        if (sub.get('cancel_at_period_end') == true) {
            sub = postStripe(path, 'cancel_at_period_end=false');   // upgrading means the customer stays
            System.debug('TSign plan change complete - cancel at period end undone');
        }
        Map<String, Object> invoice = null;
        Object latestInvoice = sub.get('latest_invoice');
        if (latestInvoice instanceof String && String.isNotBlank((String) latestInvoice)) {
            invoice = callStripe('/v1/invoices/' + EncodingUtil.urlEncode((String) latestInvoice, 'UTF-8'));
        }
        String customerId = (String) sub.get('customer');
        Map<String, Object> customer = callStripe('/v1/customers/' + EncodingUtil.urlEncode(customerId, 'UTF-8'));
        Map<String, Object> price = callStripe('/v1/prices/' + EncodingUtil.urlEncode(priceId, 'UTF-8') + '?expand%5B%5D=product');
        Map<String, Object> product = (Map<String, Object>) price.get('product');
        if (!biz.isEmpty()) {
            updateStripeCustomer(customerId, biz);
        }

        // 2. Salesforce: pending change done, then the same save as a Checkout payment
        meta.remove('pendingPlanChange');
        update new TSign_Organisation__c(Id = orgs[0].Id, Meta_Data_Deatils__c = JSON.serialize(meta));

        Map<String, Object> bizMeta = new Map<String, Object>();
        for (String key : biz.keySet()) {
            if (biz.get(key) != null && String.isNotBlank(String.valueOf(biz.get(key)))) {
                bizMeta.put('biz_' + key, String.valueOf(biz.get(key)));
            }
        }
        Map<String, Object> sessionLike = new Map<String, Object>{
            'id' => null,
            'currency' => sub.get('currency'),
            'amount_total' => invoice != null ? invoice.get('amount_paid') : null,
            'metadata' => bizMeta
        };
        Map<String, Object> allMetadata = new Map<String, Object>{
            'subscription' => sub.get('metadata'),
            'customer' => customer.get('metadata'),
            'price' => price.get('metadata'),
            'product' => product != null ? product.get('metadata') : null,
            'invoice' => invoice != null ? invoice.get('metadata') : null
        };
        Id savedOrgId = saveCheckoutToOrg(orgRecordId, sessionLike, sub, customer, price, product, invoice, allMetadata);

        Decimal balance = customer.get('balance') != null ? Decimal.valueOf(String.valueOf(customer.get('balance'))) / 100 : 0;
        result.put('changed', true);
        result.put('savedOrgId', savedOrgId);
        result.put('currencyCode', ((String) sub.get('currency')).toUpperCase());
        result.put('amountPaid', invoice != null ? toMoney(invoice.get('amount_paid')) : 0);
        result.put('creditBalance', balance < 0 ? -balance : 0);
        if (savedOrgId != null) {
            result.put('accountType', [SELECT Account_Type__c FROM TSign_Organisation__c WHERE Id = :savedOrgId].Account_Type__c);
        }
        System.debug('TSign plan change complete END ' + JSON.serialize(result));
        return result;
    }

    // pending plan change -> Meta_Data_Deatils__c.pendingPlanChange
    private static void savePendingChange(String orgRecordId, Map<String, Object> pending) {
        if (String.isBlank(orgRecordId)) {
            return;
        }
        List<TSign_Organisation__c> orgs = [
            SELECT Id, Meta_Data_Deatils__c FROM TSign_Organisation__c WHERE Id = :orgRecordId LIMIT 1
        ];
        if (orgs.isEmpty()) {
            return;
        }
        Map<String, Object> meta = readMeta(orgs[0].Meta_Data_Deatils__c);
        if (meta == null) {
            System.debug('TSign plan change - Meta_Data_Deatils__c is not JSON, pending change not saved');
            return;
        }
        meta.put('pendingPlanChange', pending);
        update new TSign_Organisation__c(Id = orgs[0].Id, Meta_Data_Deatils__c = JSON.serialize(meta));
    }

    // Meta_Data_Deatils__c as a map (empty map when blank, null when it is not JSON)
    private static Map<String, Object> readMeta(String metaJson) {
        if (String.isBlank(metaJson)) {
            return new Map<String, Object>();
        }
        try {
            Object parsed = JSON.deserializeUntyped(metaJson);
            return parsed instanceof Map<String, Object> ? (Map<String, Object>) parsed : null;
        } catch (Exception ex) {
            return null;
        }
    }

   
        // Stop trial (cancel now) / cancel at period end / keep subscription (undo the period-end cancel)
    @AuraEnabled
    public static Map<String, Object> cancelSubscription(String subscriberEmail, String stripeCustomerId, String orgRecordId, String action) {
        System.debug('TSign cancel START action=' + action + ' | email=' + subscriberEmail + ' | customer=' + stripeCustomerId + ' | org=' + orgRecordId);
        if (action != 'now' && action != 'periodEnd' && action != 'resume') {
            throw new AuraHandledException('Unknown action: ' + action);
        }

        // Business account: only a TSign Org Admin may cancel (trial or paid) - resume is allowed for everyone
        if (action != 'resume' && String.isNotBlank(orgRecordId)) {
            TSign_Organisation__c orgCheck = [SELECT Account_Type__c FROM TSign_Organisation__c WHERE Id = :orgRecordId LIMIT 1];
            String userType = [SELECT User_Type__c FROM User WHERE Id = :UserInfo.getUserId()].User_Type__c;
            System.debug('TSign cancel - account type=' + orgCheck.Account_Type__c + ' | user type=' + userType);
            if (orgCheck.Account_Type__c == 'Organisation' && userType != 'T Sign Org Admin') {
                throw new AuraHandledException(action == 'now'
                    ? 'Only your organisation admin can cancel this free trial.'
                    : 'Only your organisation admin can cancel this subscription.');
            }
        }

        // same lookup as the page - only this organisation's own current subscription can be changed
        Map<String, Object> details = getSubscriptionDetails(subscriberEmail, stripeCustomerId);
        Map<String, Object> currentPlan = (Map<String, Object>) details.get('currentPlan');
        if (currentPlan == null) {
            throw new AuraHandledException('No current subscription found.');
        }
        String subscriptionId = (String) currentPlan.get('subscriptionId');
        String path = '/v1/subscriptions/' + EncodingUtil.urlEncode(subscriptionId, 'UTF-8');

        Map<String, Object> sub;
        if (action == 'now') {
            sub = sendStripe('DELETE', path, null);                  // ends now - a trial is not charged
        } else if (action == 'periodEnd') {
            sub = postStripe(path, 'cancel_at_period_end=true');     // stays active until the paid period ends
        } else {
            sub = postStripe(path, 'cancel_at_period_end=false');    // keep subscription
        }
        String status = (String) sub.get('status');
        System.debug('TSign cancel - subscription ' + subscriptionId + ' | status=' + status
            + ' | cancel_at_period_end=' + sub.get('cancel_at_period_end'));

        // save on the TSign Organisation (after the callouts)
        if (String.isNotBlank(orgRecordId)) {
            List<TSign_Organisation__c> orgs = [
                SELECT Id, Meta_Data_Deatils__c FROM TSign_Organisation__c WHERE Id = :orgRecordId LIMIT 1
            ];
            if (!orgs.isEmpty()) {
                TSign_Organisation__c upd = new TSign_Organisation__c(Id = orgs[0].Id);
                upd.Is_Cancelled__c = action != 'resume';
                if (status == 'canceled') {
                    //upd.Active__c = false;
                    upd.Trial_Period__c = false;
                    upd.Plan_End_Date__c = Date.today();
                }
                Map<String, Object> meta = new Map<String, Object>();
                Boolean canWriteMeta = true;
                if (String.isNotBlank(orgs[0].Meta_Data_Deatils__c)) {
                    try {
                        Object parsed = JSON.deserializeUntyped(orgs[0].Meta_Data_Deatils__c);
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
                        'cancelAtPeriodEnd' => sub.get('cancel_at_period_end'),
                        'changedAt' => String.valueOf(System.now()),
                        'changedBy' => UserInfo.getUserId()
                    });
                    upd.Meta_Data_Deatils__c = JSON.serialize(meta);
                }
                update upd;
                System.debug('TSign cancel - TSign Organisation saved ' + JSON.serialize(upd));
                if (status == 'canceled') {
                    List<TSign_Subscription__c> activeSubs = [
                        SELECT Id FROM TSign_Subscription__c
                        WHERE TSign_Organisation__c = :orgs[0].Id AND Active__c = true
                    ];
                    for (TSign_Subscription__c activeSub : activeSubs) {
                        activeSub.Active__c = false;
                    }
                    if (!activeSubs.isEmpty()) {
                        update activeSubs;
                        System.debug('TSign cancel - ' + activeSubs.size() + ' subscription record(s) set inactive');
                    }
                }
            }
        }
        System.debug('TSign cancel END');
        return new Map<String, Object>{
            'subscriptionId' => subscriptionId,
            'status' => status,
            'cancelAtPeriodEnd' => sub.get('cancel_at_period_end')
        };
    }
 
   private static Map<String, Object> callStripe(String path) {
        return sendStripe('GET', path, null);
    }

    // >>> NEW: Stripe POST (form-encoded body)
    private static Map<String, Object> postStripe(String path, String body) {
        return sendStripe('POST', path, body);
    }

    // >>> CHANGED: every Stripe call goes through here (was the body of callStripe)
    private static Map<String, Object> sendStripe(String method, String path, String body) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:TSign_Subscription' + path);
        req.setMethod(method);
        req.setTimeout(20000);
        if (body != null) {
            req.setHeader('Content-Type', 'application/x-www-form-urlencoded');
            req.setBody(body);
        }
        System.debug('TSign Stripe ' + method + ' ' + path);
 
        HttpResponse res;
        try {
            res = new Http().send(req);
        } catch (Exception ex) {
            System.debug('TSign Stripe callout failed: ' + ex.getTypeName() + ' - ' + ex.getMessage());
            String msg = 'Callout to Stripe failed: ' + ex.getMessage();
            AuraHandledException ae = new AuraHandledException(msg);
            ae.setMessage(msg);
            throw ae;
        }
        System.debug('TSign Stripe status: ' + res.getStatusCode() + ' | Request-Id: ' + res.getHeader('Request-Id'));
 
        Map<String, Object> responseJson;
        try {
            responseJson = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
        } catch (Exception ex) {
            System.debug('TSign Stripe response not JSON: ' + res.getBody());
            String msg = 'Stripe returned an unreadable response (status ' + res.getStatusCode() + ')';
            AuraHandledException ae = new AuraHandledException(msg);
            ae.setMessage(msg);
            throw ae;
        }
 
        String fullJson = JSON.serializePretty(responseJson);
        for (Integer i = 0; i < fullJson.length(); i += 3000) {
            System.debug('TSign Stripe full response part ' + (i / 3000 + 1) + ':\n'
                + fullJson.substring(i, Math.min(i + 3000, fullJson.length())));
        }
 
        if (res.getStatusCode() < 200 || res.getStatusCode() >= 300) {
            Map<String, Object> err = (Map<String, Object>) responseJson.get('error');
            String errMsg = err != null ? (String) err.get('message') : res.getBody();
            System.debug('TSign Stripe error: ' + errMsg);
            String msg = 'Stripe error (' + res.getStatusCode() + '): ' + errMsg;
            AuraHandledException ae = new AuraHandledException(msg);
            ae.setMessage(msg);
            throw ae;
        }
        return responseJson;
    }

        // >>> NEW: amount of a price in a given currency (default currency or one of its currency_options)
    private static Decimal amountIn(Map<String, Object> price, String currencyCode) {
        if (String.isBlank(currencyCode) || currencyCode.equalsIgnoreCase((String) price.get('currency'))) {
            return price.get('unit_amount') != null ? Decimal.valueOf(String.valueOf(price.get('unit_amount'))) / 100 : null;
        }
        Map<String, Object> options = (Map<String, Object>) price.get('currency_options');
        Map<String, Object> option = options != null ? (Map<String, Object>) options.get(currencyCode.toLowerCase()) : null;
        return option != null && option.get('unit_amount') != null
            ? Decimal.valueOf(String.valueOf(option.get('unit_amount'))) / 100 : null;
    }

    // >>> NEW: every currency a price can be paid in, e.g. {"USD":15, "INR":599}
    private static Map<String, Object> amountsByCurrency(Map<String, Object> price) {
        Map<String, Object> result = new Map<String, Object>();
        result.put(((String) price.get('currency')).toUpperCase(), amountIn(price, null));
        Map<String, Object> options = (Map<String, Object>) price.get('currency_options');
        if (options != null) {
            for (String code : options.keySet()) {
                result.put(code.toUpperCase(), amountIn(price, code));
            }
        }
        return result;
    }
        // Upgrade saved: update the TSign Organisation (subscription fields only) + insert a new TSign Subscription child
    private static Id saveCheckoutToOrg(String orgRecordId, Map<String, Object> session, Map<String, Object> subscription,
            Map<String, Object> customer, Map<String, Object> price, Map<String, Object> product,
            Map<String, Object> invoice, Map<String, Object> allMetadata) {

        if (String.isBlank(orgRecordId)) {
            System.debug('TSign save - no TSign Organisation id passed from the page, nothing saved');
            return null;
        }
        List<TSign_Organisation__c> orgs = [
            SELECT Id, Meta_Data_Deatils__c FROM TSign_Organisation__c WHERE Id = :orgRecordId LIMIT 1
        ];
        if (orgs.isEmpty()) {
            System.debug('TSign save - TSign Organisation ' + orgRecordId + ' not found, nothing saved');
            return null;
        }
        TSign_Organisation__c org = orgs[0];

        String subscriptionId = subscription != null ? (String) subscription.get('id') : null;

        // // Already saved (e.g. page refreshed) - don't update / insert again
        // if (String.isNotBlank(subscriptionId)) {
        //     Integer alreadySaved = [
        //         SELECT COUNT() FROM TSign_Subscription__c
        //         WHERE Subscription_ID__c = :subscriptionId AND TSign_Organisation__c = :org.Id
        //     ];
        //     if (alreadySaved > 0) {
        //         System.debug('TSign save - subscription ' + subscriptionId + ' already saved, skipped');
        //         return org.Id;
        //     }
        // }
                
        // Already saved (e.g. page refreshed) - the same invoice is not saved twice
        // (the same subscription is saved again on every plan change - each change has its own invoice)
        String invoiceIdToCheck = invoice != null ? (String) invoice.get('id') : null;
        if (String.isNotBlank(invoiceIdToCheck)) {
            Integer alreadySaved = [
                SELECT COUNT() FROM TSign_Subscription__c
                WHERE Invoice_ID__c = :invoiceIdToCheck AND TSign_Organisation__c = :org.Id
            ];
            if (alreadySaved > 0) {
                System.debug('TSign save - invoice ' + invoiceIdToCheck + ' already saved, skipped');
                return org.Id;
            }
        } else if (String.isNotBlank(subscriptionId)) {
            Integer alreadySaved = [
                SELECT COUNT() FROM TSign_Subscription__c
                WHERE Subscription_ID__c = :subscriptionId AND TSign_Organisation__c = :org.Id
            ];
            if (alreadySaved > 0) {
                System.debug('TSign save - subscription ' + subscriptionId + ' already saved, skipped');
                return org.Id;
            }
        }

        // =========================================================
        // 1. UPDATE TSIGN ORGANISATION - subscription fields only
        // =========================================================
        TSign_Organisation__c upd = new TSign_Organisation__c(Id = org.Id);
        upd.Is_Cancelled__c = false;
        String customerId = customer != null ? (String) customer.get('id') : null;
        if (String.isNotBlank(customerId)) {
            upd.Stripe_Customer_ID__c = customerId;
        }

        String priceId = null;
        String interval = null;
        if (price != null) {
            priceId = (String) price.get('id');
            if (String.isNotBlank(priceId)) {
                upd.Stripe_Price_ID__c = priceId;
            }
            String taxBehavior = (String) price.get('tax_behavior');
            if (String.isNotBlank(taxBehavior)) {
                upd.Tax_Behavior__c = taxBehavior;
            }
            Map<String, Object> recurring = (Map<String, Object>) price.get('recurring');
            interval = recurring != null ? (String) recurring.get('interval') : null;
            if (interval == 'year') {
                upd.Interval__c = 'Yearly';
            } else if (interval == 'month') {
                upd.Interval__c = 'Monthly';
            }
        }

        // Account type from the product (same values as the web: Organisation / Individual)
        if (product != null) {
            Map<String, Object> productMeta = (Map<String, Object>) product.get('metadata');
            String productName = (String) product.get('name');
            String metaType = productMeta != null ? (String) productMeta.get('accountType') : null;
            if (String.isNotBlank(metaType)) {
                upd.Account_Type__c = metaType;
            } else if (productName != null && productName.containsIgnoreCase('business')) {
                upd.Account_Type__c = 'Organisation';
            } else if (productName != null && productName.containsIgnoreCase('individual')) {
                upd.Account_Type__c = 'Individual';
            }
        }
                // Business details from the upgrade popup (Stripe session metadata biz_*)
        Map<String, Object> businessDetails = new Map<String, Object>();
        Map<String, Object> sessionMeta = (Map<String, Object>) session.get('metadata');
        if (sessionMeta != null) {
            for (String key : sessionMeta.keySet()) {
                if (key.startsWith('biz_')) {
                    businessDetails.put(key.removeStart('biz_'), sessionMeta.get(key));
                }
            }
        }
        if (!businessDetails.isEmpty()) {
            System.debug('TSign save - business details ' + JSON.serialize(businessDetails));
            String legalName = bizText(businessDetails, 'legalName');
            if (legalName != null) {
                upd.Legal_Name__c = legalName;
            }
            String tradingName = bizText(businessDetails, 'tradingName');
            if (tradingName != null) {
                upd.Trading_Name__c = tradingName;
            }
            String businessType = bizText(businessDetails, 'businessType');
            if (businessType != null) {
                upd.Business_Type__c = businessType;
            }
            String teamSize = bizText(businessDetails, 'teamSize');
            if (teamSize != null) {
                upd.Team_Size__c = Decimal.valueOf(teamSize);
            }
            String phone = bizText(businessDetails, 'phone');
            if (phone != null) {
                upd.Phone__c = phone;
            }
            // String abn = bizText(businessDetails, 'abn');
            // if (abn != null) {
            //     upd.ABN__c = abn;
            // }
            // String acn = bizText(businessDetails, 'acn');
            // if (acn != null) {
            //     upd.ACN__c = acn;
            // }
            
            // registration / tax fields per country (Singapore UEN / GST stay in Meta_Data_Deatils__c)
            Map<String, String> taxFieldByKey = new Map<String, String>{
                'abn' => 'ABN__c', 'acn' => 'ACN__c',
                'pan' => 'PAN__c', 'gstin' => 'GSTN__c',
                'bn' => 'BN_Canada__c', 'gstHst' => 'GST_HST__c',
                'ein' => 'EIN__c'
            };
            for (String key : taxFieldByKey.keySet()) {
                String value = bizText(businessDetails, key);
                if (value != null) {
                    upd.put(taxFieldByKey.get(key), value);
                }
            }
            String street = bizText(businessDetails, 'street');
            String unit = bizText(businessDetails, 'unit');
            if (street != null) {
                upd.Address__Street__s = unit != null ? unit + ', ' + street : street;
            }
            String suburb = bizText(businessDetails, 'suburb');
            if (suburb != null) {
                upd.Address__City__s = suburb;
            }
            String state = bizText(businessDetails, 'state');
            if (state != null) {
                upd.Address__StateCode__s = state;
            }
            String postcode = bizText(businessDetails, 'postcode');
            if (postcode != null) {
                upd.Address__PostalCode__s = postcode;
            }
            String country = bizText(businessDetails, 'country');
            if (country != null) {
                upd.Address__CountryCode__s = country;
            }
        }

        String currencyCode = session.get('currency') != null ? ((String) session.get('currency')).toUpperCase() : null;

        // Status + plan dates
        Date startDate = null;
        Date endDate = null;
        String status = null;
        if (subscription != null) {
            status = (String) subscription.get('status');
            if (String.isNotBlank(status)) {
                upd.Active__c = status == 'active' || status == 'trialing';
                upd.Trial_Period__c = status == 'trialing';
            }
            Map<String, Object> items = (Map<String, Object>) subscription.get('items');
            List<Object> itemList = items != null ? (List<Object>) items.get('data') : null;
            Map<String, Object> item = (itemList != null && !itemList.isEmpty()) ? (Map<String, Object>) itemList[0] : null;
            Object periodStart = (item != null && item.get('current_period_start') != null)
                ? item.get('current_period_start') : subscription.get('current_period_start');
            Object periodEnd = (item != null && item.get('current_period_end') != null)
                ? item.get('current_period_end') : subscription.get('current_period_end');
            startDate = toDate(periodStart);
            endDate = toDate(periodEnd);
            if (startDate != null) {
                upd.Plan_Start_Date__c = startDate;
            }
            if (endDate != null) {
                upd.Plan_End_Date__c = endDate;
            }
        }

        // Meta_Data_Deatils__c: keep the web JSON, add this upgrade under "lastUpgrade"
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
            meta.put('lastUpgrade', new Map<String, Object>{
                'checkoutSessionId' => session.get('id'),
                'stripeCustomerId' => customerId,
                'subscriptionId' => subscriptionId,
                'subscriptionStatus' => status,
                'stripePriceId' => priceId,
                'productId' => product != null ? product.get('id') : null,
                'productName' => product != null ? product.get('name') : null,
                'interval' => interval,
                'currency' => currencyCode,
                'amountTotal' => toMoney(session.get('amount_total')),
                'invoiceId' => invoice != null ? invoice.get('id') : null,
                'invoiceNumber' => invoice != null ? invoice.get('number') : null,
                'invoiceUrl' => invoice != null ? invoice.get('hosted_invoice_url') : null,
                'currentPeriodStart' => startDate != null ? String.valueOf(startDate) : null,
                'currentPeriodEnd' => endDate != null ? String.valueOf(endDate) : null,
                'upgradedAt' => String.valueOf(System.now()),
                'businessDetails' => businessDetails,
                'metadata' => allMetadata
            });
            upd.Meta_Data_Deatils__c = JSON.serialize(meta);
        } else {
            System.debug('TSign save - Meta_Data_Deatils__c is not JSON, left unchanged');
        }

        System.debug('TSign save - updating TSign Organisation ' + JSON.serialize(upd));
        update upd;
        if (upd.Account_Type__c == 'Organisation') {
            addMyOrganisationModule(org.Id);
        }
        String contactFirst = bizText(businessDetails, 'firstName');
        String contactLast = bizText(businessDetails, 'lastName');
        if (contactFirst != null || contactLast != null) {
            List<TSign_Org_Contact__c> contacts = [
                SELECT Id FROM TSign_Org_Contact__c
                WHERE TSign_Organisation__c = :org.Id
                ORDER BY CreatedDate DESC
                LIMIT 1
            ];
            TSign_Org_Contact__c contact = contacts.isEmpty()
                ? new TSign_Org_Contact__c(TSign_Organisation__c = org.Id)
                : new TSign_Org_Contact__c(Id = contacts[0].Id);
            if (contactFirst != null) {
                contact.First_Name__c = contactFirst;
            }
            if (contactLast != null) {
                contact.Last_Name__c = contactLast;
            }
            String contactEmail = bizText(businessDetails, 'email');
            if (contactEmail != null) {
                contact.Email__c = contactEmail;
            }
            String contactPhone = bizText(businessDetails, 'phone');
            if (contactPhone != null) {
                contact.Phone__c = contactPhone;
            }
            upsert contact;
            System.debug('TSign save - primary contact ' + (contacts.isEmpty() ? 'created ' : 'updated ') + contact.Id);
        }

        // =========================================================
        // 2. INSERT NEW CHILD SUBSCRIPTION 
        // =========================================================
        TSign_Subscription__c newSub = new TSign_Subscription__c();
        newSub.TSign_Organisation__c = org.Id;
        if (String.isNotBlank(subscriptionId)) {
            newSub.Subscription_ID__c = subscriptionId;
        }
        if (String.isNotBlank(priceId)) {
            newSub.Stripe_Price_ID__c = priceId;
        }
        if (startDate != null) {
            newSub.Subscription_Start_Date__c = startDate;
        }
        if (endDate != null) {
            newSub.Subscription_End_Date__c = endDate;
        }
        if (invoice != null) {
            if (String.isNotBlank((String) invoice.get('id'))) {
                newSub.Invoice_ID__c = (String) invoice.get('id');
            }
            if (String.isNotBlank((String) invoice.get('number'))) {
                newSub.Stripe_Invoice_Number__c = (String) invoice.get('number');
            }
            if (String.isNotBlank((String) invoice.get('hosted_invoice_url'))) {
                newSub.Invoice_URL__c = (String) invoice.get('hosted_invoice_url');
            }
            Decimal amountPaid = toMoney(invoice.get('amount_paid'));
            if (amountPaid != null) {
                newSub.Invoice_Amount__c = amountPaid;
            }
            newSub.Date_Issued__c = toDate(invoice.get('created'));
        }
        if (newSub.Date_Issued__c == null) {
            newSub.Date_Issued__c = Date.today();
        }

         List<TSign_Subscription__c> previousActive = [
            SELECT Id FROM TSign_Subscription__c
            WHERE TSign_Organisation__c = :org.Id AND Active__c = true
        ];
        for (TSign_Subscription__c previous : previousActive) {
            previous.Active__c = false;
        }
        if (!previousActive.isEmpty()) {
            update previousActive;
            System.debug('TSign save - ' + previousActive.size() + ' previous subscription record(s) set inactive');
        }
        newSub.Active__c = true;
        System.debug('TSign save - inserting TSign Subscription ' + JSON.serialize(newSub));
        insert newSub;
        System.debug('TSign save - done | org=' + upd.Id + ' | new subscription record=' + newSub.Id);
        return upd.Id;
    }

    // Stripe Unix seconds -> Salesforce Date (null-safe)
    private static Date toDate(Object unixSeconds) {
        if (unixSeconds == null) {
            return null;
        }
        return Datetime.newInstance(Long.valueOf(String.valueOf(unixSeconds)) * 1000).date();
    }

    // Stripe smallest currency unit (cents / paise) -> amount (null-safe)
    private static Decimal toMoney(Object minorUnits) {
        if (minorUnits == null) {
            return null;
        }
        return Decimal.valueOf(String.valueOf(minorUnits)) / 100;
    }
    //  private static String bizText(Map<String, Object> details, String key) {
    //     Object value = details.get(key);
    //     return value != null && String.isNotBlank(String.valueOf(value)) ? String.valueOf(value).trim() : null;
    // }
         private static String bizText(Map<String, Object> details, String key) {
        Object value = details.get(key);
        return value != null && String.isNotBlank(String.valueOf(value)) ? String.valueOf(value).trim() : null;
    }

    // Popup details -> Stripe customer: name, phone, address, metadata and tax IDs (shown on Stripe invoices)
    private static void updateStripeCustomer(String customerId, Map<String, Object> biz) {
        if (String.isBlank(customerId)) {
            return;
        }
        String legalName = bizText(biz, 'legalName');
        String street = bizText(biz, 'street');
        String unit = bizText(biz, 'unit');

        String body = formParam('name', legalName)
            + formParam('phone', bizText(biz, 'phone'))
            + formParam('address[line1]', street)
            + formParam('address[line2]', unit)
            + formParam('address[city]', bizText(biz, 'suburb'))
            + formParam('address[state]', bizText(biz, 'state'))
            + formParam('address[postal_code]', bizText(biz, 'postcode'))
            + formParam('address[country]', bizText(biz, 'country'));
        for (String key : biz.keySet()) {
            body += formParam('metadata[' + key + ']', bizText(biz, key));
        }
        try {
            postStripe('/v1/customers/' + EncodingUtil.urlEncode(customerId, 'UTF-8'), body.removeStart('&'));
            System.debug('TSign stripe customer - updated ' + customerId + ' with business details');
        } catch (Exception ex) {
            System.debug('TSign stripe customer - update failed: ' + ex.getMessage());
        }

        // tax IDs Stripe supports (PAN and ACN have no Stripe type - they stay in metadata)
        Map<String, String> stripeTaxType = new Map<String, String>{
            'abn' => 'au_abn', 'gstin' => 'in_gst', 'bn' => 'ca_bn', 'gstHst' => 'ca_gst_hst',
            'uen' => 'sg_uen', 'sgGst' => 'sg_gst', 'ein' => 'us_ein'
        };
        Set<String> existingTaxIds = new Set<String>();
        try {
            Map<String, Object> taxIds = callStripe('/v1/customers/' + EncodingUtil.urlEncode(customerId, 'UTF-8') + '/tax_ids?limit=100');
            for (Object taxObj : (List<Object>) taxIds.get('data')) {
                Map<String, Object> taxId = (Map<String, Object>) taxObj;
                existingTaxIds.add(taxId.get('type') + ':' + taxId.get('value'));
            }
        } catch (Exception ex) {
            System.debug('TSign stripe customer - could not read tax ids: ' + ex.getMessage());
        }
        for (String key : stripeTaxType.keySet()) {
            String value = bizText(biz, key);
            if (value == null) {
                continue;
            }
            value = value.deleteWhitespace().toUpperCase();
            String type = stripeTaxType.get(key);
            if (existingTaxIds.contains(type + ':' + value)) {
                System.debug('TSign stripe customer - tax id ' + type + ' already on customer, skipped');
                continue;
            }
            try {
                postStripe('/v1/customers/' + EncodingUtil.urlEncode(customerId, 'UTF-8') + '/tax_ids',
                    'type=' + type + '&value=' + EncodingUtil.urlEncode(value, 'UTF-8'));
                System.debug('TSign stripe customer - tax id ' + type + ' added');
            } catch (Exception ex) {
                // e.g. Stripe rejects the format - payment is already done, so only log it
                System.debug('TSign stripe customer - tax id ' + type + ' not added: ' + ex.getMessage());
            }
        }
    }

    // '&name=value' for a Stripe form body - empty when there is no value
    private static String formParam(String name, String value) {
        return String.isBlank(value) ? '' : '&' + name + '=' + EncodingUtil.urlEncode(value, 'UTF-8');
    }

    @AuraEnabled
    public static Map<String, Object> getUpgradeFormDetails(String orgRecordId) {
        System.debug('TSign upgrade form START orgRecordId=' + orgRecordId);
        Map<String, Object> details = new Map<String, Object>();
        if (String.isBlank(orgRecordId)) {
            System.debug('TSign upgrade form - no orgRecordId, nothing to fill');
            return details;
        }
        List<TSign_Organisation__c> orgs = [
           

            SELECT Id, Email__c, Phone__c, Legal_Name__c, Trading_Name__c, Business_Type__c, Team_Size__c,
                ABN__c, ACN__c, PAN__c, GSTN__c, BN_Canada__c, GST_HST__c, EIN__c, Meta_Data_Deatils__c,
                Address__Street__s, Address__City__s, Address__StateCode__s,
                Address__PostalCode__s, Address__CountryCode__s
            FROM TSign_Organisation__c
            WHERE Id = :orgRecordId
            LIMIT 1
        ];
        if (orgs.isEmpty()) {
            System.debug('TSign upgrade form - TSign Organisation ' + orgRecordId + ' not found');
            return details;
        }
        TSign_Organisation__c org = orgs[0];
        details.put('email', org.Email__c);
        details.put('phone', org.Phone__c);
        details.put('legalName', org.Legal_Name__c);
        details.put('tradingName', org.Trading_Name__c);
        details.put('businessType', org.Business_Type__c);
        details.put('teamSize', org.Team_Size__c);
        // details.put('abn', org.ABN__c);
        // details.put('acn', org.ACN__c);
        details.put('street', org.Address__Street__s);
        details.put('suburb', org.Address__City__s);
        details.put('state', org.Address__StateCode__s);
        details.put('postcode', org.Address__PostalCode__s);
        details.put('country', org.Address__CountryCode__s);
        details.put('abn', org.ABN__c);
        details.put('acn', org.ACN__c);
        details.put('pan', org.PAN__c);
        details.put('gstin', org.GSTN__c);
        details.put('bn', org.BN_Canada__c);
        details.put('gstHst', org.GST_HST__c);
        details.put('ein', org.EIN__c);

        // Singapore UEN / GST have no org field - from the last upgrade saved in Meta_Data_Deatils__c
        if (String.isNotBlank(org.Meta_Data_Deatils__c)) {
            try {
                Map<String, Object> meta = (Map<String, Object>) JSON.deserializeUntyped(org.Meta_Data_Deatils__c);
                Map<String, Object> lastUpgrade = (Map<String, Object>) meta.get('lastUpgrade');
                Map<String, Object> lastBiz = lastUpgrade != null ? (Map<String, Object>) lastUpgrade.get('businessDetails') : null;
                if (lastBiz != null) {
                    details.put('uen', lastBiz.get('uen'));
                    details.put('sgGst', lastBiz.get('sgGst'));
                }
            } catch (Exception ex) {
                System.debug('TSign upgrade form - Meta_Data_Deatils__c not readable: ' + ex.getMessage());
            }
        }

        // primary contact (same object as My Organisation) - latest one
        List<TSign_Org_Contact__c> contacts = [
            SELECT Id, First_Name__c, Last_Name__c, Phone__c
            FROM TSign_Org_Contact__c
            WHERE TSign_Organisation__c = :org.Id
            ORDER BY CreatedDate DESC
            LIMIT 1
        ];
        if (!contacts.isEmpty()) {
            details.put('firstName', contacts[0].First_Name__c);
            details.put('lastName', contacts[0].Last_Name__c);
            if (String.isNotBlank(contacts[0].Phone__c)) {
                details.put('phone', contacts[0].Phone__c);
            }
            System.debug('TSign upgrade form - primary contact ' + contacts[0].Id);
        } else if (String.isNotBlank(org.Email__c)) {
            // no primary contact yet (e.g. Individual) - names from the staff record with the org email
            List<TSign_Staff__c> staffList = [
                SELECT First_Name__c, Last_Name__c, Phone__c
                FROM TSign_Staff__c
                WHERE Email__c = :org.Email__c
                LIMIT 1
            ];
            if (!staffList.isEmpty()) {
                details.put('firstName', staffList[0].First_Name__c);
                details.put('lastName', staffList[0].Last_Name__c);
                if (String.isBlank(org.Phone__c)) {
                    details.put('phone', staffList[0].Phone__c);
                }
                System.debug('TSign upgrade form - no primary contact, names from staff record');
            }
        }
        System.debug('TSign upgrade form END ' + JSON.serialize(details));
        return details;
    }
        // Adds "My Organisation" to Module_Access__c (multi-select) of the organisation's TSign Staff records
    private static void addMyOrganisationModule(Id orgId) {
        final String moduleName = 'My Organisation';
        List<TSign_Staff__c> staffToUpdate = new List<TSign_Staff__c>();
        for (TSign_Staff__c staff : [
            SELECT Id, Module_Access__c FROM TSign_Staff__c WHERE TSign_Organisation__c = :orgId
        ]) {
            List<String> modules = String.isBlank(staff.Module_Access__c)
                ? new List<String>() : staff.Module_Access__c.split(';');
            if (!modules.contains(moduleName)) {
                modules.add(moduleName);
                staff.Module_Access__c = String.join(modules, ';');
                staffToUpdate.add(staff);
            }
        }
        if (!staffToUpdate.isEmpty()) {
            update staffToUpdate;
        }
        System.debug('TSign save - My Organisation module added to ' + staffToUpdate.size() + ' TSign Staff record(s)');
    }
}