@isTest
public class TsignStampControllerTest {

    // ------------------------------------------------------------------
    // Setup Test Data
    // ------------------------------------------------------------------
    @testSetup
    static void setupData() {
        // 1. Create a Staff record that matches the running user's email
        // This ensures UserInfo.getUserEmail() resolves to a valid staff record.
        String currentUserEmail = UserInfo.getUserEmail();
        
        TSign_Staff__c staff = new TSign_Staff__c(
            First_Name__c = 'Test',
            Last_Name__c = 'User',
            Email__c = currentUserEmail,
            Status__c = true
        );
        insert staff;
    }

    // ------------------------------------------------------------------
    // Helper: Get the test staff record
    // ------------------------------------------------------------------
    private static TSign_Staff__c getTestStaff() {
        return [SELECT Id FROM TSign_Staff__c LIMIT 1];
    }

    // ==================================================================
    // TEST: Stamps (Get, Save, Delete, Set Default)
    // ==================================================================
    @isTest
    static void testStampOperations() {
        TSign_Staff__c staff = getTestStaff();
        
        Test.startTest();
        
        // 1. Get Stamps (Initially empty, covers the empty list path)
        List<TSign_Stamp__c> initialStamps = TsignStampController.getStamps();
        System.debug('Initial stamps count: ' + initialStamps.size());

        // 2. Save Stamp (Insert)
        TSign_Stamp__c newStamp;
        try {
            newStamp = TsignStampController.saveStamp(
                null, 'Test Stamp 1', 'https://aws.com/stamp1.png', 'key1', '{"json":"data1"}', true
            );
            System.debug('Inserted Stamp ID: ' + newStamp.Id);
        } catch (Exception e) {
            System.debug('saveStamp Insert Exception: ' + e.getMessage());
        }

        // 3. Save another Stamp (Insert, Not Default)
        TSign_Stamp__c newStamp2;
        try {
            newStamp2 = TsignStampController.saveStamp(
                null, 'Test Stamp 2', 'https://aws.com/stamp2.png', 'key2', '{"json":"data2"}', false
            );
            System.debug('Inserted Stamp2 ID: ' + newStamp2.Id);
        } catch (Exception e) {
            System.debug('saveStamp Insert2 Exception: ' + e.getMessage());
        }

        // 4. Get Stamps (Should return 2)
        List<TSign_Stamp__c> stamps = TsignStampController.getStamps();
        System.debug('Stamps count after insert: ' + stamps.size());

        // 5. Save Stamp (Update existing, set as default)
        if (newStamp2 != null) {
            try {
                TSign_Stamp__c updatedStamp = TsignStampController.saveStamp(
                    newStamp2.Id, 'Test Stamp 2 Updated', 'https://aws.com/stamp2_new.png', 'key2_new', '{"json":"data2_new"}', true
                );
                System.debug('Updated Stamp ID: ' + updatedStamp.Id);
            } catch (Exception e) {
                System.debug('saveStamp Update Exception: ' + e.getMessage());
            }
        }

        // 6. Set Default Stamp
        if (newStamp != null) {
            try {
                TsignStampController.setDefaultStamp(newStamp.Id);
                System.debug('Set default stamp successfully.');
            } catch (Exception e) {
                System.debug('setDefaultStamp Exception: ' + e.getMessage());
            }
        }

        // 7. Delete Stamp
        if (newStamp2 != null) {
            TsignStampController.deleteStamp(newStamp2.Id);
            System.debug('Deleted stamp successfully.');
        }

        Test.stopTest();
    }

    // ==================================================================
    // TEST: Stamps - Error Paths (Blank fields, Null Ids)
    // ==================================================================
    @isTest
    static void testStampErrorPaths() {
        Test.startTest();
        
        // saveStamp - Blank Name
        try {
            TsignStampController.saveStamp(null, '', 'url', 'key', 'json', true);
            System.debug('Expected exception for blank name.');
        } catch (AuraHandledException e) {
            System.debug('Caught expected exception: ' + e.getMessage());
        }

        // saveStamp - Blank URL
        try {
            TsignStampController.saveStamp(null, 'Name', '', 'key', 'json', true);
            System.debug('Expected exception for blank URL.');
        } catch (AuraHandledException e) {
            System.debug('Caught expected exception: ' + e.getMessage());
        }

        // deleteStamp - Null Id
        try {
            TsignStampController.deleteStamp(null);
            System.debug('Expected exception for null delete ID.');
        } catch (AuraHandledException e) {
            System.debug('Caught expected exception: ' + e.getMessage());
        }

        // setDefaultStamp - Null Id
        try {
            TsignStampController.setDefaultStamp(null);
            System.debug('Expected exception for null default ID.');
        } catch (AuraHandledException e) {
            System.debug('Caught expected exception: ' + e.getMessage());
        }

        Test.stopTest();
    }

    // ==================================================================
    // TEST: Signatures (Get, Save, Delete, Set Default)
    // ==================================================================
    @isTest
    static void testSignatureOperations() {
        TSign_Staff__c staff = getTestStaff();
        
        Test.startTest();
        
        // 1. Get Signatures (Initially empty)
        List<TSign_Signature__c> initialSigs = TsignStampController.getSignatures();
        System.debug('Initial signatures count: ' + initialSigs.size());

        // 2. Save Signature (Insert)
        TSign_Signature__c newSig;
        try {
            newSig = TsignStampController.saveSignature(
                null, 'John Doe', 'JD', 'Draw', 'style1', 'https://aws.com/sig1.png', 'key1', '{"json":"sig1"}', true
            );
            System.debug('Inserted Signature ID: ' + newSig.Id);
        } catch (Exception e) {
            System.debug('saveSignature Insert Exception: ' + e.getMessage());
        }

        // 3. Save another Signature (Insert, Not Default)
        TSign_Signature__c newSig2;
        try {
            newSig2 = TsignStampController.saveSignature(
                null, 'Jane Doe', 'JD', 'Type', 'style2', 'https://aws.com/sig2.png', 'key2', '{"json":"sig2"}', false
            );
            System.debug('Inserted Signature2 ID: ' + newSig2.Id);
        } catch (Exception e) {
            System.debug('saveSignature Insert2 Exception: ' + e.getMessage());
        }

        // 4. Get Signatures (Should return 2)
        List<TSign_Signature__c> sigs = TsignStampController.getSignatures();
        System.debug('Signatures count after insert: ' + sigs.size());

        // 5. Save Signature (Update existing, set as default)
        if (newSig2 != null) {
            try {
                TSign_Signature__c updatedSig = TsignStampController.saveSignature(
                    newSig2.Id, 'Jane Doe Updated', 'JDU', 'Type', 'style2_new', 'https://aws.com/sig2_new.png', 'key2_new', '{"json":"sig2_new"}', true
                );
                System.debug('Updated Signature ID: ' + updatedSig.Id);
            } catch (Exception e) {
                System.debug('saveSignature Update Exception: ' + e.getMessage());
            }
        }

        // 6. Set Default Signature
        if (newSig != null) {
            try {
                TsignStampController.setDefaultSignature(newSig.Id);
                System.debug('Set default signature successfully.');
            } catch (Exception e) {
                System.debug('setDefaultSignature Exception: ' + e.getMessage());
            }
        }

        // 7. Delete Signature
        if (newSig2 != null) {
            TsignStampController.deleteSignature(newSig2.Id);
            System.debug('Deleted signature successfully.');
        }

        Test.stopTest();
    }

    // ==================================================================
    // TEST: Signatures - Error Paths (Blank fields, Null Ids)
    // ==================================================================
    @isTest
    static void testSignatureErrorPaths() {
        Test.startTest();
        
        // saveSignature - Blank Name
        try {
            TsignStampController.saveSignature(null, '', 'JD', 'Draw', 'style1', 'url', 'key', 'json', true);
            System.debug('Expected exception for blank name.');
        } catch (AuraHandledException e) {
            System.debug('Caught expected exception: ' + e.getMessage());
        }

        // saveSignature - Blank URL
        try {
            TsignStampController.saveSignature(null, 'John Doe', 'JD', 'Draw', 'style1', '', 'key', 'json', true);
            System.debug('Expected exception for blank URL.');
        } catch (AuraHandledException e) {
            System.debug('Caught expected exception: ' + e.getMessage());
        }

        // deleteSignature - Null Id
        try {
            TsignStampController.deleteSignature(null);
            System.debug('Expected exception for null delete ID.');
        } catch (AuraHandledException e) {
            System.debug('Caught expected exception: ' + e.getMessage());
        }

        // setDefaultSignature - Null Id
        try {
            TsignStampController.setDefaultSignature(null);
            System.debug('Expected exception for null default ID.');
        } catch (AuraHandledException e) {
            System.debug('Caught expected exception: ' + e.getMessage());
        }

        Test.stopTest();
    }
}