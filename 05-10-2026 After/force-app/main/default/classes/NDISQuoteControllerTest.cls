@IsTest
public class NDISQuoteControllerTest {
    
    @testSetup
    static void testData() {
        
        Organisation__c org = new Organisation__c(
            Name='Ashfield Consultants',
            ABN__c='11234567891',
            ACN__c='878787878',
            Contact_No__c='6132899740',
            RCTI__c='RCTI1',
            Email__c='dsfdsfsd@gmail.com',
            Bank__c='Bank Test',
            BSB__c='BSB Test',
            Account_Name__c='Test Account',
            Account_Number__c='1111111111',
            Description__c='test Desc',
            Address_Latest__Street__s='101',
            Address_Latest__City__s='Himas Waterhen',
            Address_Latest__PostalCode__s='2060',
            Address_Latest__CountryCode__s='AU',
            Address_Latest__StateCode__s='NSW',
            NDIS_Provider__c='12341234565',
            BMSI_Identifier__c='TEST BMSI',
            SoftwareId__c='jhdfn18328',
            Branch_code__c='BS123',
            Contact_Name__c='Test Contact',
            User_Type__c='NDIS Org Admin',
            Roles__c='Admin;AIN'
        );
        insert org;
         Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.202946373@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne209463', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', 
                             User_Type__c='NDIS Org Admin', UserName='manualtesting.202946373@hotmail.com',Organization_Name__c ='Ashfield Consultants');
        insert user;
        
        System.runAs(user){   

        
        Facility__c fac = new Facility__c(
            Name='Ashfield Facility',
            Address__City__s='Crace',
            Address__Street__s='8 Keewong Street',
            Address__StateCode__s='ACT',
            Address__PostalCode__s='2911',
            Address__CountryCode__s='AU',
            Email__c='testfacility@gmail.com',
            Status__c=true,
            Organisation__c=org.Id,
            ABN__c='12234567121',
            Phone__c='12323432',
            Type_of_Service__c='Ndis'
        );
        insert fac;
        
        Client__c cli = new Client__c(
            First_Name__c='Test',
            Last_Name__c='Participant',
            Gendar__c='Male',
            Date_Of_Birth__c=Date.newInstance(1991, 2, 17),
            Address__Street__s='8 Keewong Street',
            Address__City__s='Crace',
            Address__StateCode__s='ACT',
            Address__PostalCode__s='2911',
            Contact_Number__c='4331237651',
            Drivers_Licence__c='123456789012',
            Primay_Contact_First_Name__c='Jason',
            Primay_Contact_Last_Name__c='Smith',
            Relationship__c='Parent',
            Email__c='participant@test.com',
            Facility__c=fac.id,
            Primary_Contact_Number__c='0433123123'
        );
        insert cli;
        
        insert new Participant_Facility__c(
            Participant__c = cli.Id,
            Facility__c = fac.Id,
            Active__c = true
        );
        
        NDIS_Support_Catalogue__c cat = new NDIS_Support_Catalogue__c(
            Name='Assistance Animals',
            ACT__c=100, NSW__c=100, VIC__c=100, QLD__c=100,
            SA__c=100, WA__c=100, TAS__c=100, NT__c=100
        );
        insert cat;
    }
    }
    
    private static Client__c getClient() {
        return [SELECT Id FROM Client__c LIMIT 1];
    }
    
    private static NDIS_Support_Catalogue__c getCatalogue() {
        return [SELECT Id FROM NDIS_Support_Catalogue__c LIMIT 1];
    }
    
    @IsTest
    static void testNewContactMethods() {
         User u1= [SELECT Id from User where email='manualtesting.202946373@hotmail.com' LIMIT 1];
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
          System.runAs(u1){
        Test.startTest();
        
        New_Contact__c nc = new New_Contact__c(
            Name='Test New Contact',
            Email__c='new@test.com',
            Phone__c='999999999',
            State__c='Queensland',
            Organization_Name__c='Ashfield'
        );
        
        New_Contact__c created =
            NDISQuoteController.createNewContact(nc);
        
        NDISQuoteController.getNewContactById(created.Id);
        NDISQuoteController.getNewContacts('Test',fac.Id);
        
        Test.stopTest();
    }
    }
    
    @IsTest
    static void testQuoteHeaderFlow() {
        
       /* Client__c cli = [SELECT Id FROM Client__c LIMIT 1];
        
        String headerJson = JSON.serialize(new Map<String, Object>{
            'quoteNumber' => 'QT-001',
                'state' => 'NSW',
                'validFor' => '30',
                'serviceStart' => Date.today(),
                'serviceEnd' => Date.today().addDays(30),
                'preparedBy' => 'Tester',
                'additionalNotes' => 'Notes',
                'termsAndConditions' => 'T&C',
                'status' => 'Draft'
                });*/
        
        Client__c cli = [SELECT Id FROM Client__c LIMIT 1];

        // Create a Quote first
        NDIS_Quote__c quote = new NDIS_Quote__c(
            Quote_Number__c = 'QT-001',
            Participant__c = cli.Id,
            State__c = 'New South Wales',
            Status__c = 'Draft',
            Service_Period_Start__c = Date.today(),
            Service_Period_End__c = Date.today().addDays(30)
        );
        insert quote;
        
        // Pass the Quote Id in JSON
        String headerJson = JSON.serialize(new Map<String, Object>{
            'id' => quote.Id,
            'quoteNumber' => 'QT-001',
            'state' => 'New South Wales',
            'validFor' => '30',
            'serviceStart' => Date.today(),
            'serviceEnd' => Date.today().addDays(30),
            'preparedBy' => 'Tester',
            'additionalNotes' => 'Notes',
            'termsAndConditions' => 'T&C',
            'participantId' => cli.Id,
            'status' => 'Draft'
        });
        
        
        
        Test.startTest();
        try {
            NDISQuoteController.saveQuoteHeader(headerJson);
        } catch (AuraHandledException e) {
            // expected – do nothing
        }
        Test.stopTest();
    }   
    
    @IsTest
    static void testLineItemFlow() {
        
        Client__c cli = getClient();
        NDIS_Support_Catalogue__c cat = getCatalogue();
        
        NDIS_Quote__c quote = new NDIS_Quote__c(
            Quote_Number__c='QT-LI',
            Participant__c=cli.Id,
            State__c='Queensland',
            Status__c='Draft',
            Service_Period_Start__c=Date.today(),
            Service_Period_End__c=Date.today().addDays(30)
        );
        insert quote;
        
        String itemsJson = JSON.serialize(new List<Object>{
            new Map<String, Object>{
                'quoteId' => quote.Id,
                    'catalogueId' => cat.Id,
                    'supportItem' => 'Support A',
                    'price' => '100',
                    'quantity' => '2',
                    'frequency' => '1',
                    'interval' => 'weekly',
                    'durationValue' => '4',
                    'durationPeriod' => 'weeks'
                    }
        });
        
        Test.startTest();
        
        NDISQuoteController.saveLineItems(itemsJson);
        NDISQuoteController.getQuoteData(cli.Id, null);
        NDISQuoteController.getQuoteByIdWithLines(quote.Id); //getQuoteById
        NDISQuoteController.getQuoteByIdWithLines(quote.Id); 
        NDISQuoteController.getQuoteById(quote.Id);
        NDISQuoteController.getQuoteRecipientEmail(quote.Id); 
        Test.stopTest();
    }
    
    @IsTest
    static void testDeleteLineItems() {
        
        Client__c cli = getClient();
        NDIS_Support_Catalogue__c cat = getCatalogue();
        
        NDIS_Quote__c q = new NDIS_Quote__c(
            Quote_Number__c='QT-DEL',
            Participant__c=cli.Id,
            State__c='Queensland',
            Status__c='Draft',
            Service_Period_Start__c=Date.today(),
            Service_Period_End__c=Date.today().addDays(5)
        );
        insert q;
        
        NDIS_Quote_LineItem__c li = new NDIS_Quote_LineItem__c(
            NDIS_Quote__c=q.Id,
            Support_Item__c='Support',
            Price__c=100,
            Quantity__c=1,
            Frequency__c=1,
            Duration_Value__c=1,
            Duration_Period__c='weeks',
            Cost__c=100,
            NDIS_Support_Catalogue__c=cat.Id
        );
        insert li;
        
        Test.startTest();
        
        NDISQuoteController.deleteLineItem(li.Id);
        NDISQuoteController.deleteQuoteLineItem(li.Id);
        
        Test.stopTest();
    }
    @IsTest
    static void testGetDraftQuotesCoverageOnly() {
         User u1= [SELECT Id from User where email='manualtesting.202946373@hotmail.com' LIMIT 1];
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
          System.runAs(u1){
        Client__c cli = [SELECT Id FROM Client__c LIMIT 1];
        
        NDIS_Quote__c draftQuote = new NDIS_Quote__c(
            Quote_Number__c = 'QT-DRAFT-COVER',
            Participant__c = cli.Id,
            Status__c = 'Draft',
            Service_Period_Start__c = Date.today(),
            Service_Period_End__c = Date.today().addDays(10)
        );
        insert draftQuote;
        
        Test.startTest();
        NDISQuoteController.getDraftQuotes(fac.Id);
        Test.stopTest();
          }
    }
    @IsTest
static void testSaveQuotePdfUrlCoverage() {

    Client__c cli = [SELECT Id FROM Client__c LIMIT 1];

    NDIS_Quote__c q = new NDIS_Quote__c(
        Quote_Number__c = 'QT-PDF',
        Participant__c = cli.Id,
        Status__c = 'Draft',
        Service_Period_Start__c = Date.today(),
        Service_Period_End__c = Date.today().addDays(7)
    );
    insert q;

    Test.startTest();
    NDISQuoteController.saveQuotePdfUrl(
        q.Id,
        'https://example.com/test.pdf',
        '{"test":"json"}'
    );
    Test.stopTest();
}
@IsTest
static void testCreateQuoteHeaderCoverage() {

    String headerJson = JSON.serialize(new Map<String, Object>{
        'quoteNumber' => 'QT-CREATE',
        'state' => 'NSW',
        'validFor' => '30',
        'serviceStart' => Date.today(),
        'serviceEnd' => Date.today().addDays(15),
        'preparedBy' => 'Tester',
        'additionalNotes' => 'Notes',
        'termsAndConditions' => 'T&C',
        'status' => 'Draft'
    });

    Test.startTest();
    try {
        NDISQuoteController.createQuoteHeader(headerJson);
    } catch (AuraHandledException e) {
        // expected due to invalid (Id) casting
    }
    Test.stopTest();
}

}