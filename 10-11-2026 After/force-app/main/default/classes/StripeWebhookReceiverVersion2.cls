@RestResource(urlMapping='/stripe/v2/*')
global without sharing class StripeWebhookReceiverVersion2 {

    @HttpPost
    global static void receive() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;

        String body = req.requestBody == null ? '' : req.requestBody.toString();
        String sigHeader = getHeader(req, 'Stripe-Signature');

        System.debug('Webhook received. hasSignature=' + (sigHeader != null));

        // -------------------------------------------------------------------
        // 1. SIGNATURE VALIDATION
        // Note: Commented out for Postman testing. 
        // YOU MUST UNCOMMENT THIS BEFORE GOING TO PRODUCTION.
        // -------------------------------------------------------------------
        /*
        if (!isValid(body, sigHeader)) {
            System.debug('Signature validation FAILED. Returning HTTP 400.');
            res.statusCode = 400;
            return;
        }
        System.debug('Signature validation PASSED.');
        */

        try {
            // 2. Parse the JSON body
            Map<String, Object> rootObj = (Map<String, Object>) JSON.deserializeUntyped(body);
            
            // 3. Ensure this is a Stripe Event and navigate to data.object
            if (!rootObj.containsKey('data')) {
                System.debug('No "data" node found in payload.');
                res.statusCode = 400;
                return;
            }
            
            Map<String, Object> dataObj = (Map<String, Object>) rootObj.get('data');
            Map<String, Object> stripeObject = (Map<String, Object>) dataObj.get('object');
            
            if (stripeObject == null) {
                System.debug('No "object" found inside "data".');
                res.statusCode = 400;
                return;
            }
            
            // OPTIONAL BUT RECOMMENDED: Only create users if payment is actually paid
            String paymentStatus = (String) stripeObject.get('payment_status');
            if (paymentStatus != null && paymentStatus != 'paid') {
                System.debug('Payment status is not "paid". Ignoring. Status: ' + paymentStatus);
                res.statusCode = 200;
                return;
            }

            // 4. Extract the metadata
            Map<String, Object> metadata = (Map<String, Object>) stripeObject.get('metadata');
            String jsonString = JSON.serializePretty(metadata);
            System.debug('metadata==> ' + jsonString);
            
                       if (metadata != null) {
                Map<String, Object> details = new Map<String, Object>();
                
                // Standard fields
                details.put('email', metadata.get('email'));
                details.put('accountType', metadata.get('accountType'));
                details.put('userType', metadata.get('userType'));
                details.put('phone', metadata.get('phone')); // Added
                
                // Organization fields
                details.put('organisationName', metadata.get('organisationName'));
                details.put('organisationEmail', metadata.get('organisationEmail'));
                details.put('facilityName', metadata.get('facilityName'));
                details.put('tradingName', metadata.get('tradingName')); // Added
                details.put('businessType', metadata.get('businessType')); // Added
                details.put('teamSize', metadata.get('teamSize')); // Added
                details.put('id_au_abn', metadata.get('id_au_abn')); // Added
                details.put('id_au_acn', metadata.get('id_au_acn')); // Added
                           
                details.put('id_us_ein', metadata.get('id_us_ein')); // Added
                details.put('id_ca_bn', metadata.get('id_ca_bn')); // Added
                
                details.put('id_ca_gst_hst', metadata.get('id_ca_gst_hst')); // Added
                details.put('id_sg_uen', metadata.get('id_sg_uen')); // Added
                 
                details.put('id_in_pan', metadata.get('id_sg_gst')); // Added
                           
                details.put('id_in_gst', metadata.get('id_in_gst')); // Added
                details.put('id_in_pan', metadata.get('id_in_pan')); // Added
                
                // Individual fields
                details.put('firstName', metadata.get('firstName'));
                details.put('lastName', metadata.get('lastName'));
                
                // Primary Contact fields
                details.put('primaryContactFirstName', metadata.get('primaryContactFirstName'));
                details.put('primaryContactLastName', metadata.get('primaryContactLastName'));
                details.put('primaryContactEmail', metadata.get('primaryContactEmail'));
                details.put('primaryContactPhone', metadata.get('primaryContactPhone'));
                
                // Address fields
                details.put('addressLine1', metadata.get('addressLine1'));
                details.put('addressLine2', metadata.get('addressLine2'));
                details.put('addressCity', metadata.get('addressCity'));
                details.put('addressState', metadata.get('addressState'));
                details.put('addressPostalCode', metadata.get('addressPostalCode'));
                details.put('addressCountry', metadata.get('addressCountry'));
                details.put('market', metadata.get('market'));
                details.put('trial', metadata.get('trial'));
                
                // Subscription & Billing fields (NEW)
                details.put('currency', metadata.get('currency'));
                details.put('interval', metadata.get('interval'));
                details.put('taxBehavior', metadata.get('taxBehavior'));
                details.put('stripeCustomerId', metadata.get('stripeCustomerId'));
                details.put('stripePriceId', metadata.get('stripePriceId'));
                details.put('subscriptionId', metadata.get('subscriptionId'));
                details.put('subscriptionStatus', metadata.get('subscriptionStatus'));
                
                // Invoice fields (NEW)
                details.put('invoiceUrl', metadata.get('invoiceUrl'));
                details.put('invoiceId', metadata.get('invoiceId'));
                details.put('invoiceNumber', metadata.get('invoiceNumber'));
                details.put('invoiceStatus', metadata.get('invoiceStatus'));
                details.put('invoiceAmountPaid', metadata.get('invoiceAmountPaid'));
                
                // Period & Terms Dates (NEW)
                details.put('currentPeriodStart', metadata.get('currentPeriodStart'));
                details.put('currentPeriodEnd', metadata.get('currentPeriodEnd'));
                details.put('acceptedTermsAt', metadata.get('acceptedTermsAt'));
                details.put('acceptedTerms', metadata.get('acceptedTerms'));
                
                System.debug('Calling TSignPortalUserController with details: ' + JSON.serializePretty(details));
                
                // Call your controller
                TSignPortalUserController.createTSignPortalUser(details);
                
                res.statusCode = 200;
            } else {
                System.debug('No metadata found in payload.');
                res.statusCode = 400; // Bad Request
            }

        } catch (Exception e) {
            System.debug(LoggingLevel.ERROR, 'Webhook processing failed: ' + e.getMessage() + '\n' + e.getStackTraceString());
            res.statusCode = 500; // Internal Server Error
        }
    }

    // --- Helper Methods ---

    private static String getHeader(RestRequest req, String name) {
        for (String k : req.headers.keySet()) {
            if (k.equalsIgnoreCase(name)) return req.headers.get(k);
        }
        return null;
    }

    // Keep your isValid method here
    @TestVisible
    private static Boolean isValid(String body, String sigHeader) {
        if (String.isBlank(sigHeader)) return false;
        if (String.isBlank(System.Label.Stripe_Webhook_Secret)) return false;

        String timestamp;
        Set<String> v1Sigs = new Set<String>();
        for (String part : sigHeader.split(',')) {
            List<String> kv = part.trim().split('=', 2);
            if (kv.size() != 2) continue;
            if (kv[0] == 't')  timestamp = kv[1];
            if (kv[0] == 'v1') v1Sigs.add(kv[1].toLowerCase());
        }

        if (timestamp == null || v1Sigs.isEmpty()) return false;

        Long ts;
        try {
            ts = Long.valueOf(timestamp);
        } catch (Exception e) {
            return false;
        }

        Long nowSec  = Datetime.now().getTime() / 1000;
        if (Math.abs(nowSec - ts) > 300) return false; // 5 min tolerance

        Blob mac = Crypto.generateMac(
            'HmacSHA256',
            Blob.valueOf(timestamp + '.' + body),
            Blob.valueOf(System.Label.Stripe_Webhook_Secret.trim())
        );
        
        return v1Sigs.contains(EncodingUtil.convertToHex(mac));
    }
}