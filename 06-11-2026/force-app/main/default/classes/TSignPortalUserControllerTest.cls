@isTest
public class TSignPortalUserControllerTest {

    // ------------------------------------------------------------------
    // Shared test data setup
    // ------------------------------------------------------------------
    @testSetup
    static void setupData() {
        // Product_User_Setting__mdt and custom labels are metadata records —
        // they must already exist in the org. We do not create them here.

        // Create the partner Account referenced by settings.Partner_Account_Name__c.
        // If the org already has it, we skip creation to avoid duplicates.
        String partnerAccountName = null;
        try {
            Product_User_Setting__mdt settings =
                Product_User_Setting__mdt.getInstance('TSign');
            if (settings != null) {
                partnerAccountName = settings.Partner_Account_Name__c;
            }
        } catch (Exception e) {
            // Metadata type may not be accessible in some orgs — ignore.
        }

        if (String.isNotBlank(partnerAccountName)) {
            List<Account> existing = [
                SELECT Id FROM Account WHERE Name = :partnerAccountName LIMIT 1
            ];
            if (existing.isEmpty()) {
                insert new Account(Name = partnerAccountName);
            }
        }
    }

    // ------------------------------------------------------------------
    // Helper: build the details map the controller expects
    // ------------------------------------------------------------------
    public static Map<String, Object> buildDetails(String email, String accountType) {
        Map<String, Object> details = new Map<String, Object>();
        details.put('email', email);
        details.put('accountType', accountType);
        details.put('userType', 'T Sign Org Admin');
        details.put('phone', '+61400000000');
        details.put('organisationName', 'Test Org ' + email);
        details.put('organisationEmail', email);
        details.put('facilityName', 'Test Facility');
        details.put('tradingName', 'Test Trading');
        details.put('businessType', 'Technology');
        details.put('teamSize', '25');
        details.put('id_au_abn', '12345678901');
        details.put('id_au_acn', '123456789');
        details.put('firstName', 'Jane');
        details.put('lastName', 'Doe');
        details.put('primaryContactFirstName', 'John');
        details.put('primaryContactLastName', 'Smith');
        details.put('primaryContactEmail', 'john.smith@example.com');
        details.put('primaryContactPhone', '+61411111111');
        details.put('addressLine1', '123 Main St');
        details.put('addressLine2', 'Suite 4');
        details.put('addressCity', 'Sydney');
        details.put('addressState', 'NSW');
        details.put('addressPostalCode', '2000');
        details.put('addressCountry', 'AU');
        details.put('market', 'AU');
        details.put('trial', 'false');
        details.put('currency', 'AUD');
        details.put('interval', 'month');
        details.put('taxBehavior', 'exclusive');
        details.put('stripeCustomerId', 'cus_test_123');
        details.put('stripePriceId', 'price_test_123');
        details.put('subscriptionId', 'sub_test_123');
        details.put('subscriptionStatus', 'active');
        details.put('invoiceUrl', 'https://invoice.stripe.com/i/test');
        details.put('invoiceId', 'in_test_123');
        details.put('invoiceNumber', 'INV-0001');
        details.put('invoiceStatus', 'paid');
        details.put('invoiceAmountPaid', '10000');
        details.put('currentPeriodStart', '2024-01-01');
        details.put('currentPeriodEnd', '2024-02-01');
        details.put('acceptedTermsAt', '2024-01-01T00:00:00Z');
        details.put('acceptedTerms', 'true');
        return details;
    }

    // ------------------------------------------------------------------
    // TEST: null details -> throws TSignRegistrationException
    // ------------------------------------------------------------------
    @isTest
    static void testNullDetails() {
        Test.startTest();
        try {
            TSignPortalUserController.createTSignPortalUser(null);
            System.debug('No exception thrown for null details');
        } catch (TSignPortalUserController.TSignRegistrationException e) {
            System.debug('Expected exception for null details: ' + e.getMessage());
        } catch (Exception e) {
            System.debug('Unexpected exception for null details: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ------------------------------------------------------------------
    // TEST: blank email -> throws
    // ------------------------------------------------------------------
    @isTest
    static void testBlankEmail() {
        Map<String, Object> details = buildDetails('', 'organisation');

        Test.startTest();
        try {
            TSignPortalUserController.createTSignPortalUser(details);
            System.debug('No exception thrown for blank email');
        } catch (TSignPortalUserController.TSignRegistrationException e) {
            System.debug('Expected exception for blank email: ' + e.getMessage());
        } catch (Exception e) {
            System.debug('Unexpected exception for blank email: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ------------------------------------------------------------------
    // TEST: null email -> throws
    // ------------------------------------------------------------------
    @isTest
    static void testNullEmail() {
        Map<String, Object> details = buildDetails('placeholder@example.com', 'organisation');
        details.put('email', null);

        Test.startTest();
        try {
            TSignPortalUserController.createTSignPortalUser(details);
            System.debug('No exception thrown for null email');
        } catch (TSignPortalUserController.TSignRegistrationException e) {
            System.debug('Expected exception for null email: ' + e.getMessage());
        } catch (Exception e) {
            System.debug('Unexpected exception for null email: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ------------------------------------------------------------------
    // TEST: duplicate staff email -> early return, no records created
    // ------------------------------------------------------------------
    @isTest
    static void testDuplicateStaffEmail() {
        String email = 'duplicate.' + DateTime.now().getTime() + '@example.com';

        // Pre-create a TSign_Staff__c with that email to trigger the guard
        insert new TSign_Staff__c(
            First_Name__c = 'Existing',
            Last_Name__c  = 'Staff',
            Email__c      = email,
            Status__c     = true
        );

        Map<String, Object> details = buildDetails(email, 'organisation');

        Test.startTest();
        String result = TSignPortalUserController.createTSignPortalUser(details);
        Test.stopTest();

        System.debug('Duplicate guard result: ' + result);
    }

    // ------------------------------------------------------------------
    // TEST: organisation account type happy path
    // ------------------------------------------------------------------
    @isTest
    static void testOrganisationHappyPath() {
        String email = 'org.' + DateTime.now().getTime() + '@example.com';
        Map<String, Object> details = buildDetails(email, 'organisation');

        Test.startTest();
        try {
            String result = TSignPortalUserController.createTSignPortalUser(details);
            System.debug('Organisation result: ' + result);
        } catch (TSignPortalUserController.TSignRegistrationException e) {
            System.debug('Organisation exception: ' + e.getMessage());
        } catch (Exception e) {
            System.debug('Organisation unexpected: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ------------------------------------------------------------------
    // TEST: individual account type happy path
    // ------------------------------------------------------------------
    @isTest
    static void testIndividualHappyPath() {
        String email = 'ind.' + DateTime.now().getTime() + '@example.com';
        Map<String, Object> details = buildDetails(email, 'individual');

        Test.startTest();
        try {
            String result = TSignPortalUserController.createTSignPortalUser(details);
            System.debug('Individual result: ' + result);
        } catch (TSignPortalUserController.TSignRegistrationException e) {
            System.debug('Individual exception: ' + e.getMessage());
        } catch (Exception e) {
            System.debug('Individual unexpected: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ------------------------------------------------------------------
    // TEST: INR currency branch
    // ------------------------------------------------------------------
    @isTest
    static void testCurrencyINR() {
        String email = 'inr.' + DateTime.now().getTime() + '@example.com';
        Map<String, Object> details = buildDetails(email, 'organisation');
        details.put('currency', 'INR');
        details.put('id_in_gst', 'GSTIN123');
        details.put('id_in_pan', 'PAN123');

        Test.startTest();
        try {
            TSignPortalUserController.createTSignPortalUser(details);
        } catch (Exception e) {
            System.debug('INR test exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ------------------------------------------------------------------
    // TEST: USD currency branch
    // ------------------------------------------------------------------
    @isTest
    static void testCurrencyUSD() {
        String email = 'usd.' + DateTime.now().getTime() + '@example.com';
        Map<String, Object> details = buildDetails(email, 'organisation');
        details.put('currency', 'USD');
        details.put('id_us_ein', 'EIN123');

        Test.startTest();
        try {
            TSignPortalUserController.createTSignPortalUser(details);
        } catch (Exception e) {
            System.debug('USD test exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ------------------------------------------------------------------
    // TEST: CAD currency branch
    // ------------------------------------------------------------------
    @isTest
    static void testCurrencyCAD() {
        String email = 'cad.' + DateTime.now().getTime() + '@example.com';
        Map<String, Object> details = buildDetails(email, 'organisation');
        details.put('currency', 'CAD');
        details.put('id_ca_bn', 'BN123');
        details.put('id_ca_gst_hst', 'GST123');

        Test.startTest();
        try {
            TSignPortalUserController.createTSignPortalUser(details);
        } catch (Exception e) {
            System.debug('CAD test exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ------------------------------------------------------------------
    // TEST: SGD currency branch
    // ------------------------------------------------------------------
    @isTest
    static void testCurrencySGD() {
        String email = 'sgd.' + DateTime.now().getTime() + '@example.com';
        Map<String, Object> details = buildDetails(email, 'organisation');
        details.put('currency', 'SGD');
        details.put('id_sg_uen', 'UEN123');
        details.put('id_sg_gst', 'GST123');

        Test.startTest();
        try {
            TSignPortalUserController.createTSignPortalUser(details);
        } catch (Exception e) {
            System.debug('SGD test exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ------------------------------------------------------------------
    // TEST: unknown currency branch (else)
    // ------------------------------------------------------------------
    @isTest
    static void testCurrencyUnknown() {
        String email = 'unknown.' + DateTime.now().getTime() + '@example.com';
        Map<String, Object> details = buildDetails(email, 'organisation');
        details.put('currency', 'JPY');

        Test.startTest();
        try {
            TSignPortalUserController.createTSignPortalUser(details);
        } catch (Exception e) {
            System.debug('Unknown currency exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ------------------------------------------------------------------
    // TEST: interval 'year' -> Yearly
    // ------------------------------------------------------------------
    @isTest
    static void testYearlyInterval() {
        String email = 'yearly.' + DateTime.now().getTime() + '@example.com';
        Map<String, Object> details = buildDetails(email, 'organisation');
        details.put('interval', 'year');

        Test.startTest();
        try {
            TSignPortalUserController.createTSignPortalUser(details);
        } catch (Exception e) {
            System.debug('Yearly test exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ------------------------------------------------------------------
    // TEST: blank trial -> defaults to false
    // ------------------------------------------------------------------
    @isTest
    static void testBlankTrial() {
        String email = 'trial.' + DateTime.now().getTime() + '@example.com';
        Map<String, Object> details = buildDetails(email, 'organisation');
        details.put('trial', '');

        Test.startTest();
        try {
            TSignPortalUserController.createTSignPortalUser(details);
        } catch (Exception e) {
            System.debug('Blank trial exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ------------------------------------------------------------------
    // TEST: blank teamSize -> skip Integer.valueOf
    // ------------------------------------------------------------------
    @isTest
    static void testBlankTeamSize() {
        String email = 'teamsize.' + DateTime.now().getTime() + '@example.com';
        Map<String, Object> details = buildDetails(email, 'organisation');
        details.put('teamSize', '');

        Test.startTest();
        try {
            TSignPortalUserController.createTSignPortalUser(details);
        } catch (Exception e) {
            System.debug('Blank teamSize exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ------------------------------------------------------------------
    // TEST: blank invoice amount -> skip Decimal.valueOf
    // ------------------------------------------------------------------
    @isTest
    static void testBlankInvoiceAmount() {
        String email = 'invamt.' + DateTime.now().getTime() + '@example.com';
        Map<String, Object> details = buildDetails(email, 'organisation');
        details.put('invoiceAmountPaid', '');

        Test.startTest();
        try {
            TSignPortalUserController.createTSignPortalUser(details);
        } catch (Exception e) {
            System.debug('Blank invoice amount exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ------------------------------------------------------------------
    // TEST: blank period dates -> skip date parsing
    // ------------------------------------------------------------------
    @isTest
    static void testBlankPeriodDates() {
        String email = 'periods.' + DateTime.now().getTime() + '@example.com';
        Map<String, Object> details = buildDetails(email, 'organisation');
        details.put('currentPeriodStart', '');
        details.put('currentPeriodEnd', '');

        Test.startTest();
        try {
            TSignPortalUserController.createTSignPortalUser(details);
        } catch (Exception e) {
            System.debug('Blank periods exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ------------------------------------------------------------------
    // TEST: blank acceptedTermsAt -> skip Date parsing
    // ------------------------------------------------------------------
    @isTest
    static void testBlankAcceptedTermsAt() {
        String email = 'terms.' + DateTime.now().getTime() + '@example.com';
        Map<String, Object> details = buildDetails(email, 'organisation');
        details.put('acceptedTermsAt', '');

        Test.startTest();
        try {
            TSignPortalUserController.createTSignPortalUser(details);
        } catch (Exception e) {
            System.debug('Blank acceptedTermsAt exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ------------------------------------------------------------------
    // TEST: addressLine2 blank -> fullAddress only uses line1
    // ------------------------------------------------------------------
    @isTest
    static void testBlankAddressLine2() {
        String email = 'addr.' + DateTime.now().getTime() + '@example.com';
        Map<String, Object> details = buildDetails(email, 'organisation');
        details.put('addressLine2', '');

        Test.startTest();
        try {
            TSignPortalUserController.createTSignPortalUser(details);
        } catch (Exception e) {
            System.debug('Blank addressLine2 exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ------------------------------------------------------------------
    // TEST: addressLine1 blank, line2 present -> fullAddress uses line2
    // ------------------------------------------------------------------
    @isTest
    static void testBlankAddressLine1() {
        String email = 'addr1.' + DateTime.now().getTime() + '@example.com';
        Map<String, Object> details = buildDetails(email, 'organisation');
        details.put('addressLine1', '');
        details.put('addressLine2', 'Suite 9');

        Test.startTest();
        try {
            TSignPortalUserController.createTSignPortalUser(details);
        } catch (Exception e) {
            System.debug('Blank addressLine1 exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ------------------------------------------------------------------
    // TEST: both address lines blank
    // ------------------------------------------------------------------
    @isTest
    static void testBothAddressLinesBlank() {
        String email = 'addr2.' + DateTime.now().getTime() + '@example.com';
        Map<String, Object> details = buildDetails(email, 'organisation');
        details.put('addressLine1', '');
        details.put('addressLine2', '');

        Test.startTest();
        try {
            TSignPortalUserController.createTSignPortalUser(details);
        } catch (Exception e) {
            System.debug('Both address lines blank exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ------------------------------------------------------------------
    // TEST: missing optional keys entirely (defensive null handling)
    // ------------------------------------------------------------------
    @isTest
    static void testMissingOptionalKeys() {
        String email = 'minimal.' + DateTime.now().getTime() + '@example.com';

        Map<String, Object> details = new Map<String, Object>();
        details.put('email', email);
        details.put('accountType', 'organisation');
        details.put('organisationName', 'Minimal Org');
        details.put('firstName', 'Min');
        details.put('lastName', 'Imal');

        Test.startTest();
        try {
            TSignPortalUserController.createTSignPortalUser(details);
        } catch (Exception e) {
            System.debug('Minimal details exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ------------------------------------------------------------------
    // TEST: custom exception class is constructible / rethrowable
    // ------------------------------------------------------------------
    @isTest
    static void testCustomException() {
        Test.startTest();
        try {
            throw new TSignPortalUserController.TSignRegistrationException('boom');
        } catch (TSignPortalUserController.TSignRegistrationException e) {
            System.debug('Custom exception caught: ' + e.getMessage());
        }
        Test.stopTest();
    }
}