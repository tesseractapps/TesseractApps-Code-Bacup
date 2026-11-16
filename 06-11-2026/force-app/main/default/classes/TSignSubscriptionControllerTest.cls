@isTest
private class TSignSubscriptionControllerTest {

    private static final String EMAIL = 'org@test.com';
    private static final String RET = 'https://tsign.test/return';

    // ---------- Stripe mock: first matching (method + url part) wins ----------
    private class StripeMock implements HttpCalloutMock {
        List<String> methods = new List<String>();
        List<String> parts = new List<String>();
        List<Integer> codes = new List<Integer>();
        List<String> bodies = new List<String>();
        Boolean throwEx = false;

        public StripeMock add(String method, String part, Object body) {
            return addRaw(method, part, 200, JSON.serialize(body));
        }
        public StripeMock addRaw(String method, String part, Integer code, String body) {
            methods.add(method);
            parts.add(part);
            codes.add(code);
            bodies.add(body);
            return this;
        }
        public HTTPResponse respond(HTTPRequest req) {
            if (throwEx) {
                throw new CalloutException('boom');
            }
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            for (Integer i = 0; i < parts.size(); i++) {
                if (req.getMethod() == methods[i] && req.getEndpoint().contains(parts[i])) {
                    res.setStatusCode(codes[i]);
                    res.setBody(bodies[i]);
                    return res;
                }
            }
            res.setStatusCode(200);
            res.setBody('{}');
            return res;
        }
    }

    // ---------- Stripe JSON builders ----------
    private static List<Object> lst(Object o) {
        return new List<Object>{ o };
    }

    private static Map<String, Object> priceMap(String productName) {
        return new Map<String, Object>{
            'id' => 'price_1',
            'currency' => 'usd',
            'unit_amount' => 1500,
            'tax_behavior' => 'exclusive',
            'metadata' => new Map<String, Object>(),
            'recurring' => new Map<String, Object>{ 'interval' => 'month' },
            'currency_options' => new Map<String, Object>{
                'inr' => new Map<String, Object>{ 'unit_amount' => 59900 }
            },
            'product' => new Map<String, Object>{
                'id' => 'prod_1', 'name' => productName, 'metadata' => new Map<String, Object>()
            }
        };
    }

    private static Map<String, Object> subMap(String id, String status, Boolean cancelAtEnd) {
        Map<String, Object> item = new Map<String, Object>{
            'id' => 'si_1',
            'quantity' => 2,
            'current_period_start' => 1700000000,
            'current_period_end' => 1900000000,
            'price' => new Map<String, Object>{
                'id' => 'price_1', 'product' => 'prod_1',
                'recurring' => new Map<String, Object>{ 'interval' => 'month' }
            }
        };
        return new Map<String, Object>{
            'id' => id,
            'status' => status,
            'currency' => 'usd',
            'customer' => 'cus_1',
            'cancel_at_period_end' => cancelAtEnd,
            'trial_end' => null,
            'current_period_end' => 1900000000,
            'latest_invoice' => 'in_1',
            'metadata' => new Map<String, Object>(),
            'items' => new Map<String, Object>{ 'data' => lst(item) }
        };
    }

    private static Map<String, Object> canceledSubMap() {
        Map<String, Object> item = new Map<String, Object>{
            'quantity' => 1,
            'price' => new Map<String, Object>{
                'id' => 'price_1', 'product' => 'prod_1',
                'recurring' => new Map<String, Object>{ 'interval' => 'year' }
            }
        };
        return new Map<String, Object>{
            'id' => 'sub_c', 'status' => 'canceled', 'ended_at' => 1700000000,
            'items' => new Map<String, Object>{ 'data' => lst(item) }
        };
    }

    private static Map<String, Object> customerMap(String email, Integer balanceCents) {
        return new Map<String, Object>{
            'id' => 'cus_1', 'email' => email, 'currency' => 'usd',
            'balance' => balanceCents, 'metadata' => new Map<String, Object>()
        };
    }

    private static Map<String, Object> invoiceMap() {
        return new Map<String, Object>{
            'id' => 'in_1', 'number' => 'INV-1', 'hosted_invoice_url' => 'https://inv.test/1',
            'amount_paid' => 1500, 'created' => 1700000000, 'metadata' => new Map<String, Object>()
        };
    }

    private static Map<String, Object> sessionMap(String status, Map<String, Object> meta) {
        return new Map<String, Object>{
            'id' => 'cs_1', 'status' => status, 'payment_status' => 'paid',
            'currency' => 'usd', 'amount_total' => 1500, 'metadata' => meta,
            'subscription' => subMap('sub_1', 'active', false),
            'customer' => customerMap(EMAIL, 0),
            'invoice' => invoiceMap(),
            'line_items' => new Map<String, Object>{
                'data' => lst(new Map<String, Object>{ 'price' => priceMap('Business Plan') })
            }
        };
    }

    // customer + subscription list + price routes (status null = no subscriptions)
    private static StripeMock subRoutes(StripeMock m, String status) {
        List<Object> subs = status == null ? new List<Object>() : lst(subMap('sub_1', status, false));
        return m.add('GET', '/v1/customers/cus_1', customerMap(EMAIL, -500))
            .add('GET', '/v1/subscriptions?status=all', new Map<String, Object>{ 'data' => subs })
            .add('GET', '/v1/prices/price_1', priceMap('Business Plan'));
    }

    // sets the mock AND starts a fresh transaction context, so a callout is
    // never blocked by "uncommitted work pending" from earlier test DML
    private static void use(StripeMock m) {
        Test.setMock(HttpCalloutMock.class, m);
        Test.startTest();
    }

    // ---------- data ----------
    @TestSetup
    static void setup() {
        TriggerUtility.bypassTrigger = true;

        Map<String, Object> lastUpgrade = new Map<String, Object>{
            'lastUpgrade' => new Map<String, Object>{
                'businessDetails' => new Map<String, Object>{ 'uen' => 'U1', 'sgGst' => 'G1' }
            }
        };
        Map<String, Object> pendOk = new Map<String, Object>{
            'pendingPlanChange' => new Map<String, Object>{
                'token' => 'tok1', 'subscriptionId' => 'sub_1', 'priceId' => 'price_1', 'quantity' => 2,
                'businessDetails' => new Map<String, Object>{ 'legalName' => 'Legal Pty', 'abn' => '12345678901' }
            }
        };
        Map<String, Object> pendBad = new Map<String, Object>{
            'pendingPlanChange' => new Map<String, Object>{
                'token' => 'tok2', 'subscriptionId' => 'sub_1', 'priceId' => 'price_other', 'quantity' => 1,
                'businessDetails' => new Map<String, Object>()
            }
        };

        List<TSign_Organisation__c> orgs = new List<TSign_Organisation__c>{
            new TSign_Organisation__c(Name = 'Sub Org', Email__c = EMAIL, Account_Type__c = 'Individual'),
            new TSign_Organisation__c(Name = 'Biz Org', Email__c = 'biz@test.com', Account_Type__c = 'Organisation',
                Meta_Data_Deatils__c = JSON.serialize(lastUpgrade)),
            new TSign_Organisation__c(Name = 'Pending OK', Email__c = 'p1@test.com',
                Meta_Data_Deatils__c = JSON.serialize(pendOk)),
            new TSign_Organisation__c(Name = 'Pending Mismatch', Email__c = 'p2@test.com',
                Meta_Data_Deatils__c = JSON.serialize(pendBad)),
            new TSign_Organisation__c(Name = 'Dup Org', Email__c = 'dup@test.com')
        };
        insert orgs;

        Map<String, Id> idBy = new Map<String, Id>();
        for (TSign_Organisation__c o : orgs) {
            idBy.put(o.Name, o.Id);
        }

        // optional child data: failures here only affect the tests that read them
        try {
            insert new TSign_Staff__c(TSign_Organisation__c = idBy.get('Sub Org'), Email__c = EMAIL,
                First_Name__c = 'John', Last_Name__c = 'Doe', Status__c = true);
        } catch (Exception e) {}
        try {
            insert new TSign_Org_Contact__c(TSign_Organisation__c = idBy.get('Biz Org'),
                First_Name__c = 'Ann', Last_Name__c = 'Lee', Phone__c = '0400000000');
        } catch (Exception e) {}
        try {
            insert new TSign_Subscription__c(TSign_Organisation__c = idBy.get('Dup Org'),
                Invoice_ID__c = 'in_1', Subscription_ID__c = 'sub_1', Active__c = true,
                Date_Issued__c = Date.today());
        } catch (Exception e) {}
    }

    private static Id orgId(String name) {
        return [SELECT Id FROM TSign_Organisation__c WHERE Name = :name LIMIT 1].Id;
    }

    private static String meta(Id id) {
        return [SELECT Meta_Data_Deatils__c FROM TSign_Organisation__c WHERE Id = :id].Meta_Data_Deatils__c;
    }

    // ---------- getPlans ----------
    @isTest
    static void testGetPlans() {
        use(new StripeMock()
            .add('GET', '/v1/products', new Map<String, Object>{
                'data' => lst(new Map<String, Object>{ 'id' => 'prod_1', 'name' => 'Business Plan', 'description' => 'd' })
            })
            .add('GET', '/v1/prices?', new Map<String, Object>{ 'data' => lst(priceMap('x')) }));

        List<Map<String, Object>> plans = TSignSubscriptionController.getPlans();
        Test.stopTest();

        Assert.isTrue(plans.size() == 1);
        Assert.isTrue(((List<Map<String, Object>>) plans[0].get('prices')).size() == 1);
    }

    // ---------- sendStripe error paths (through getPlans) ----------
    @isTest
    static void testStripeErrorStatus() {
        use(new StripeMock().addRaw('GET', '/v1/products', 400, '{"error":{"message":"boom"}}'));
        Boolean thrown = false;
        try {
            TSignSubscriptionController.getPlans();
        } catch (AuraHandledException e) {
            thrown = true;
        }
        Test.stopTest();
        Assert.isTrue(thrown);
    }

    @isTest
    static void testStripeNotJson() {
        use(new StripeMock().addRaw('GET', '/v1/products', 200, 'not json'));
        Boolean thrown = false;
        try {
            TSignSubscriptionController.getPlans();
        } catch (AuraHandledException e) {
            thrown = true;
        }
        Test.stopTest();
        Assert.isTrue(thrown);
    }

    @isTest
    static void testStripeCalloutException() {
        StripeMock m = new StripeMock();
        m.throwEx = true;
        use(m);
        Boolean thrown = false;
        try {
            TSignSubscriptionController.getPlans();
        } catch (AuraHandledException e) {
            thrown = true;
        }
        Test.stopTest();
        Assert.isTrue(thrown);
    }

    // ---------- getSubscriptionDetails ----------
    @isTest
    static void testDetailsBlankEmail() {
        Integer thrown = 0;
        try { TSignSubscriptionController.getSubscriptionDetails('', 'cus_1'); } catch (AuraHandledException e) { thrown++; }
        try { TSignSubscriptionController.getSubscriptionDetails('-', 'cus_1'); } catch (AuraHandledException e) { thrown++; }
        Assert.isTrue(thrown == 2);
    }

    @isTest
    static void testDetailsCustomerIdActive() {
        use(subRoutes(new StripeMock(), 'active'));
        Map<String, Object> r = TSignSubscriptionController.getSubscriptionDetails(EMAIL, 'cus_1');
        Test.stopTest();

        Assert.isTrue(r.get('foundBy') == 'customerId+email');
        Assert.isNotNull(r.get('currentPlan'));
        Assert.isNotNull(r.get('creditBalance'));
        Map<String, Object> plan = (Map<String, Object>) r.get('currentPlan');
        Assert.isTrue(plan.get('priceId') == 'price_1');
    }

    @isTest
    static void testDetailsEmailMismatch() {
        use(new StripeMock()
            .add('GET', '/v1/customers/cus_1', customerMap('other@test.com', 0))
            .add('GET', '/v1/subscriptions?status=all', new Map<String, Object>{ 'data' => new List<Object>() }));
        Map<String, Object> r = TSignSubscriptionController.getSubscriptionDetails(EMAIL, 'cus_1');
        Test.stopTest();
        Assert.isTrue(r.get('foundBy') == 'customerId');
        Assert.isTrue(r.get('emailMismatch') == true);
        Assert.isNull(r.get('currentPlan'));
    }

    @isTest
    static void testDetailsDeletedCustomer() {
        use(new StripeMock().add('GET', '/v1/customers/cus_1',
            new Map<String, Object>{ 'id' => 'cus_1', 'deleted' => true }));
        Map<String, Object> r = TSignSubscriptionController.getSubscriptionDetails(EMAIL, 'cus_1');
        Test.stopTest();
        Assert.isTrue(r.get('foundBy') == 'none');
        Assert.isNull(r.get('currentPlan'));
    }

    @isTest
    static void testDetailsByEmailLastCancelled() {
        use(new StripeMock()
            .add('GET', '/v1/customers?limit=1', new Map<String, Object>{ 'data' => lst(customerMap(EMAIL, 0)) })
            .add('GET', '/v1/subscriptions?status=all', new Map<String, Object>{ 'data' => lst(canceledSubMap()) }));
        Map<String, Object> r = TSignSubscriptionController.getSubscriptionDetails(EMAIL, null);
        Test.stopTest();
        Assert.isTrue(r.get('foundBy') == 'email');
        Assert.isNull(r.get('currentPlan'));
        Assert.isNotNull(r.get('lastPlan'));
    }

    @isTest
    static void testDetailsNoCustomer() {
        use(new StripeMock().add('GET', '/v1/customers?limit=1',
            new Map<String, Object>{ 'data' => new List<Object>() }));
        Map<String, Object> r = TSignSubscriptionController.getSubscriptionDetails(EMAIL, null);
        Test.stopTest();
        Assert.isTrue(r.get('foundBy') == 'none');
    }

    // ---------- createUpgradeCheckout ----------
    @isTest
    static void testCheckoutValidation() {
        Integer thrown = 0;
        try { TSignSubscriptionController.createUpgradeCheckout('bad', RET, EMAIL, null, null, null); } catch (AuraHandledException e) { thrown++; }
        try { TSignSubscriptionController.createUpgradeCheckout('price_1', '', EMAIL, null, null, null); } catch (AuraHandledException e) { thrown++; }
        Assert.isTrue(thrown == 2);
    }

    @isTest
    static void testCheckoutNewCustomer() {
        Id o = orgId('Sub Org');
        use(new StripeMock()
            .add('GET', '/v1/customers?limit=1', new Map<String, Object>{ 'data' => new List<Object>() })
            .add('GET', '/v1/prices/price_1', priceMap('Business Plan'))
            .add('POST', '/v1/checkout/sessions', new Map<String, Object>{ 'id' => 'cs_1', 'url' => 'https://checkout.test' }));

        String url = TSignSubscriptionController.createUpgradeCheckout(
            'price_1', RET, EMAIL, null, String.valueOf(o), '{"teamSize":"3","legalName":"X"}');
        Test.stopTest();
        Assert.isTrue(url == 'https://checkout.test');
    }

    @isTest
    static void testCheckoutExistingCustomerExpiresOpenSessions() {
        Id o = orgId('Sub Org');
        use(subRoutes(new StripeMock(), null)
            .add('GET', '/v1/checkout/sessions?status=open', new Map<String, Object>{
                'data' => lst(new Map<String, Object>{ 'id' => 'cs_open' })
            })
            .add('POST', '/expire', new Map<String, Object>{ 'id' => 'cs_open' })
            .add('POST', '/v1/checkout/sessions', new Map<String, Object>{ 'id' => 'cs_2', 'url' => 'https://checkout.test/2' }));

        String url = TSignSubscriptionController.createUpgradeCheckout(
            'price_1', RET, EMAIL, 'cus_1', String.valueOf(o), null);
        Test.stopTest();
        Assert.isTrue(url == 'https://checkout.test/2');
    }

    @isTest
    static void testCheckoutBlockedWhenActive() {
        Id o = orgId('Sub Org');
        use(subRoutes(new StripeMock(), 'active'));
        Boolean thrown = false;
        try {
            TSignSubscriptionController.createUpgradeCheckout('price_1', RET, EMAIL, 'cus_1', String.valueOf(o), null);
        } catch (AuraHandledException e) {
            thrown = true;
        }
        Test.stopTest();
        Assert.isTrue(thrown);
    }

    // ---------- getCheckoutResult ----------
    @isTest
    static void testCheckoutResultInvalid() {
        Boolean thrown = false;
        try {
            TSignSubscriptionController.getCheckoutResult('bad', null);
        } catch (AuraHandledException e) {
            thrown = true;
        }
        Assert.isTrue(thrown);
    }

    @isTest
    static void testCheckoutResultComplete() {
        Id o = orgId('Sub Org');
        Map<String, Object> sessMeta = new Map<String, Object>{
            'replaceSubscriptionId' => 'sub_old',
            'biz_legalName' => 'Legal Pty', 'biz_tradingName' => 'Trade', 'biz_teamSize' => '3',
            'biz_phone' => '0400000000', 'biz_abn' => '12345678901', 'biz_acn' => '123456789',
            'biz_street' => '1 Test St', 'biz_unit' => 'U2', 'biz_suburb' => 'Sydney',
            'biz_state' => 'NSW', 'biz_postcode' => '2000', 'biz_country' => 'AU',
            'biz_firstName' => 'Sam', 'biz_lastName' => 'Smith', 'biz_email' => 'sam@test.com'
        };
        use(new StripeMock()
            .add('DELETE', '/v1/subscriptions/sub_old', new Map<String, Object>{ 'id' => 'sub_old', 'status' => 'canceled' })
            .add('POST', '/v1/customers/cus_1/tax_ids', new Map<String, Object>{ 'id' => 'txi_1' })
            .add('GET', '/v1/customers/cus_1/tax_ids', new Map<String, Object>{ 'data' => new List<Object>() })
            .add('POST', '/v1/customers/cus_1', new Map<String, Object>{ 'id' => 'cus_1' })
            .add('GET', '/v1/checkout/sessions/cs_1', sessionMap('complete', sessMeta)));

        Map<String, Object> r = TSignSubscriptionController.getCheckoutResult('cs_1', String.valueOf(o));
        Test.stopTest();

        Assert.isTrue(r.get('savedOrgId') == o);
        Assert.isTrue(r.get('accountType') == 'Organisation');
        Assert.isTrue([SELECT COUNT() FROM TSign_Subscription__c
                       WHERE TSign_Organisation__c = :o AND Invoice_ID__c = 'in_1'] == 1);
        Assert.isTrue(meta(o).contains('lastUpgrade'));
    }

    @isTest
    static void testCheckoutResultSimpleComplete() {
        Id o = orgId('Sub Org');
        use(new StripeMock().add('GET', '/v1/checkout/sessions/cs_1',
            sessionMap('complete', new Map<String, Object>())));
        Map<String, Object> r = TSignSubscriptionController.getCheckoutResult('cs_1', String.valueOf(o));
        Test.stopTest();
        Assert.isTrue(r.get('savedOrgId') == o);
    }

    @isTest
    static void testCheckoutResultAlreadySaved() {
        Id o = orgId('Dup Org');
        use(new StripeMock().add('GET', '/v1/checkout/sessions/cs_1',
            sessionMap('complete', new Map<String, Object>())));
        Map<String, Object> r = TSignSubscriptionController.getCheckoutResult('cs_1', String.valueOf(o));
        Test.stopTest();
        Assert.isTrue(r.get('savedOrgId') == o);
    }

    @isTest
    static void testCheckoutResultNotComplete() {
        Id o = orgId('Sub Org');
        use(new StripeMock().add('GET', '/v1/checkout/sessions/cs_1',
            sessionMap('open', new Map<String, Object>())));
        Map<String, Object> r = TSignSubscriptionController.getCheckoutResult('cs_1', String.valueOf(o));
        Test.stopTest();
        Assert.isFalse(r.containsKey('savedOrgId'));
    }

    @isTest
    static void testCheckoutResultNoOrgId() {
        use(new StripeMock().add('GET', '/v1/checkout/sessions/cs_1',
            sessionMap('complete', new Map<String, Object>())));
        Map<String, Object> r = TSignSubscriptionController.getCheckoutResult('cs_1', null);
        Test.stopTest();
        Assert.isNull(r.get('savedOrgId'));
    }

    // ---------- startPlanChange ----------
    @isTest
    static void testPlanChangeInvalidPrice() {
        Boolean thrown = false;
        try {
            TSignSubscriptionController.startPlanChange('bad', RET, EMAIL, 'cus_1', null, null);
        } catch (AuraHandledException e) {
            thrown = true;
        }
        Assert.isTrue(thrown);
    }

    @isTest
    static void testPlanChangeNoCurrentSubscription() {
        Id o = orgId('Sub Org');
        use(subRoutes(new StripeMock(), null)
            .add('GET', '/v1/checkout/sessions?status=open', new Map<String, Object>{ 'data' => new List<Object>() })
            .add('POST', '/v1/checkout/sessions', new Map<String, Object>{ 'id' => 'cs_1', 'url' => 'https://checkout.test' }));

        Map<String, Object> r = TSignSubscriptionController.startPlanChange(
            'price_1', RET, EMAIL, 'cus_1', String.valueOf(o), null);
        Test.stopTest();
        Assert.isTrue(r.get('mode') == 'checkout');
        Assert.isTrue(r.get('url') == 'https://checkout.test');
    }

    @isTest
    static void testPlanChangeTrial() {
        Id o = orgId('Sub Org');
        use(subRoutes(new StripeMock(), 'trialing')
            .add('GET', '/v1/checkout/sessions?status=open', new Map<String, Object>{ 'data' => new List<Object>() })
            .add('POST', '/v1/checkout/sessions', new Map<String, Object>{ 'id' => 'cs_1', 'url' => 'https://checkout.test/trial' }));

        Map<String, Object> r = TSignSubscriptionController.startPlanChange(
            'price_1', RET, EMAIL, 'cus_1', String.valueOf(o), null);
        Test.stopTest();
        Assert.isTrue(r.get('url') == 'https://checkout.test/trial');
    }

    @isTest
    static void testPlanChangePaidWithTeamSize() {
        Id o = orgId('Sub Org');
        use(subRoutes(new StripeMock(), 'active')
            .add('GET', '/v1/subscriptions/sub_1', subMap('sub_1', 'active', false))
            .add('POST', '/v1/billing_portal/sessions', new Map<String, Object>{ 'id' => 'bps_1', 'url' => 'https://portal.test' }));

        Map<String, Object> r = TSignSubscriptionController.startPlanChange(
            'price_1', RET, EMAIL, 'cus_1', String.valueOf(o), '{"teamSize":"5"}');
        Test.stopTest();
        Assert.isTrue(r.get('url') == 'https://portal.test');
        Assert.isTrue(meta(o).contains('pendingPlanChange'));
    }

    @isTest
    static void testPlanChangePaidIndividualAndNoOrg() {
        Map<String, Object> indiv = priceMap('Individual Plan');
        use(new StripeMock()
            .add('GET', '/v1/customers/cus_1', customerMap(EMAIL, 0))
            .add('GET', '/v1/subscriptions?status=all', new Map<String, Object>{ 'data' => lst(subMap('sub_1', 'active', false)) })
            .add('GET', '/v1/subscriptions/sub_1', subMap('sub_1', 'active', false))
            .add('GET', '/v1/prices/price_1', indiv)
            .add('POST', '/v1/billing_portal/sessions', new Map<String, Object>{ 'id' => 'bps_1', 'url' => 'https://portal.test' }));

        Map<String, Object> r = TSignSubscriptionController.startPlanChange(
            'price_1', RET, EMAIL, 'cus_1', null, null);
        Test.stopTest();
        Assert.isTrue(r.get('mode') == 'checkout');
    }

    // ---------- completePlanChange ----------
    @isTest
    static void testCompletePlanChangeGuards() {
        Assert.isFalse((Boolean) TSignSubscriptionController.completePlanChange('', 'tok1').get('changed'));
        Assert.isFalse((Boolean) TSignSubscriptionController.completePlanChange(
            String.valueOf(TSign_Organisation__c.SObjectType.getDescribe().getKeyPrefix() + '000000000001'), 'tok1').get('changed'));
        // wrong token
        Assert.isFalse((Boolean) TSignSubscriptionController.completePlanChange(
            String.valueOf(orgId('Pending OK')), 'nope').get('changed'));
    }

    @isTest
    static void testCompletePlanChangeSuccess() {
        Id o = orgId('Pending OK');
        use(new StripeMock()
            .add('POST', '/v1/customers/cus_1/tax_ids', new Map<String, Object>{ 'id' => 'txi_1' })
            .add('GET', '/v1/customers/cus_1/tax_ids', new Map<String, Object>{ 'data' => new List<Object>() })
            .add('POST', '/v1/customers/cus_1', new Map<String, Object>{ 'id' => 'cus_1' })
            .add('GET', '/v1/customers/cus_1', customerMap(EMAIL, -500))
            .add('POST', '/v1/subscriptions/sub_1', subMap('sub_1', 'active', false))
            .add('GET', '/v1/subscriptions/sub_1', subMap('sub_1', 'active', true))
            .add('GET', '/v1/invoices/in_1', invoiceMap())
            .add('GET', '/v1/prices/price_1', priceMap('Business Plan')));

        Map<String, Object> r = TSignSubscriptionController.completePlanChange(String.valueOf(o), 'tok1');
        Test.stopTest();

        Assert.isTrue((Boolean) r.get('changed'));
        Assert.isTrue(r.get('savedOrgId') == o);
        Assert.isFalse(meta(o).contains('pendingPlanChange'));
    }

    @isTest
    static void testCompletePlanChangePriceMismatch() {
        Id o = orgId('Pending Mismatch');
        use(new StripeMock()
            .add('GET', '/v1/subscriptions/sub_1', subMap('sub_1', 'active', false)));
        Map<String, Object> r = TSignSubscriptionController.completePlanChange(String.valueOf(o), 'tok2');
        Test.stopTest();
        Assert.isFalse((Boolean) r.get('changed'));
    }

    // ---------- cancelSubscription ----------
    @isTest
    static void testCancelInvalidAction() {
        Boolean thrown = false;
        try {
            TSignSubscriptionController.cancelSubscription(EMAIL, 'cus_1', null, 'bogus');
        } catch (AuraHandledException e) {
            thrown = true;
        }
        Assert.isTrue(thrown);
    }

    @isTest
    static void testCancelNow() {
        Id o = orgId('Sub Org');
        use(subRoutes(new StripeMock(), 'active')
            .add('DELETE', '/v1/subscriptions/sub_1', new Map<String, Object>{
                'id' => 'sub_1', 'status' => 'canceled', 'cancel_at_period_end' => false }));

        Map<String, Object> r = TSignSubscriptionController.cancelSubscription(EMAIL, 'cus_1', String.valueOf(o), 'now');
        Test.stopTest();

        Assert.isTrue(r.get('status') == 'canceled');
        Assert.isTrue([SELECT Is_Cancelled__c FROM TSign_Organisation__c WHERE Id = :o].Is_Cancelled__c);
        Assert.isTrue(meta(o).contains('lastCancel'));
    }

    @isTest
    static void testCancelPeriodEnd() {
        Id o = orgId('Sub Org');
        use(subRoutes(new StripeMock(), 'active')
            .add('POST', '/v1/subscriptions/sub_1', new Map<String, Object>{
                'id' => 'sub_1', 'status' => 'active', 'cancel_at_period_end' => true }));
        TSignSubscriptionController.cancelSubscription(EMAIL, 'cus_1', String.valueOf(o), 'periodEnd');
        Test.stopTest();
        Assert.isTrue([SELECT Is_Cancelled__c FROM TSign_Organisation__c WHERE Id = :o].Is_Cancelled__c);
    }

    @isTest
    static void testResume() {
        Id o = orgId('Sub Org');
        use(subRoutes(new StripeMock(), 'active')
            .add('POST', '/v1/subscriptions/sub_1', new Map<String, Object>{
                'id' => 'sub_1', 'status' => 'active', 'cancel_at_period_end' => false }));
        TSignSubscriptionController.cancelSubscription(EMAIL, 'cus_1', String.valueOf(o), 'resume');
        Test.stopTest();
        Assert.isFalse([SELECT Is_Cancelled__c FROM TSign_Organisation__c WHERE Id = :o].Is_Cancelled__c);
    }

    @isTest
    static void testCancelNoCurrentSubscription() {
        Id o = orgId('Sub Org');
        use(subRoutes(new StripeMock(), null));
        Boolean thrown = false;
        try {
            TSignSubscriptionController.cancelSubscription(EMAIL, 'cus_1', String.valueOf(o), 'now');
        } catch (AuraHandledException e) {
            thrown = true;
        }
        Test.stopTest();
        Assert.isTrue(thrown);
    }

    @isTest
    static void testCancelBusinessNonAdmin() {
        String userType = [SELECT User_Type__c FROM User WHERE Id = :UserInfo.getUserId()].User_Type__c;
        if (userType == 'T Sign Org Admin') {
            return;   // running user is an admin: the block does not apply
        }
        Boolean thrown = false;
        try {
            TSignSubscriptionController.cancelSubscription(EMAIL, 'cus_1', String.valueOf(orgId('Biz Org')), 'now');
        } catch (AuraHandledException e) {
            thrown = true;
        }
        Assert.isTrue(thrown);
    }

    // ---------- getUpgradeFormDetails ----------
    @isTest
    static void testUpgradeFormBlankAndMissing() {
        Assert.isTrue(TSignSubscriptionController.getUpgradeFormDetails('').isEmpty());
        Assert.isTrue(TSignSubscriptionController.getUpgradeFormDetails(
            TSign_Organisation__c.SObjectType.getDescribe().getKeyPrefix() + '000000000001').isEmpty());
    }

    @isTest
    static void testUpgradeFormContactAndMeta() {
        Map<String, Object> d = TSignSubscriptionController.getUpgradeFormDetails(String.valueOf(orgId('Biz Org')));
        Assert.isTrue(d.get('uen') == 'U1');
        Assert.isTrue(d.get('sgGst') == 'G1');
        Assert.isTrue(d.get('firstName') == 'Ann');
    }

    @isTest
    static void testUpgradeFormStaffFallback() {
        Map<String, Object> d = TSignSubscriptionController.getUpgradeFormDetails(String.valueOf(orgId('Sub Org')));
        Assert.isTrue(d.get('email') == EMAIL);
        Assert.isTrue(d.get('firstName') == 'John');
    }
}