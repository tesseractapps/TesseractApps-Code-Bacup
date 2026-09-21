@isTest
public class CreateCompanyControllerTest {
     @testSetup
    static void setupData() {
          // Step 1: Create Organisation
        Organisation__c org = new Organisation__c();
        org.Name='Ashfield Consultants';
        org.ABN__c='11234567891';
        org.ACN__c='878787878';
        org.Contact_No__c='6132899740';
        org.RCTI__c='RCTI1';
        org.Email__c='dsfdsfsd@gmail.com';
        org.Bank__c='Bank Test';
        org.BSB__c='BSB Test';
        org.Account_Name__c='Test Account';
        org.Account_Number__c='1111111111';
        org.Description__c='test Desc';
        org.Address_Latest__Street__s='101';
        org.Address_Latest__City__s='Himas Waterhen';
        org.Address_Latest__PostalCode__s='2060';
        org.Address_Latest__CountryCode__s='AU';
        org.Address_Latest__StateCode__s='NSW';
        org.NDIS_Provider__c='12341234565';
        org.BMSI_Identifier__c ='TEST BMSI';
        org.SoftwareId__c = 'jhdfn18328';
        org.Branch_code__c = 'BS123';
        org.Contact_Name__c = 'Test Contact';
        org.General_Shift_End_time__c='6:30 am';
        org.General_Shift_Start_Time__c='8:30 am';
        org.Afternoon_Shift_End_Time__c='3:30 pm';
        org.Afternoon_Shift_Start_Time__c='4:00 pm';
        org.Custom_Shift_Start_Time__c='6:30 am';
        org.Custom_Shift_End_Time__c='8:30 am';
        org.Night_Shift_End_Time__c='6:30 pm';
        org.Night_Shift_Start_Time__c='8:30 pm';
        org.User_Type__c='NDIS Org Admin';
        org.Support_Email__c = 'saran.kumar@tesseractapps.com';
        insert org;
 
       Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.20294637@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne209463', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.20294637@hotmail.com',Organization_Name__c ='Ashfield Consultants');
        insert user;
    }
    @isTest
    static void testGetFacility() {
        Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
       
        // Step 2: Create Companies under the Organisation
       // Company__c company1 = new Company__c(Company_Name__c = 'Facility Match', ABN__c = '12345678901', Organization__c = org.Id);
        //Company__c company2 = new Company__c(Company_Name__c = 'Another Match', ABN__c = '12345678902',Organization__c = org.Id);
        Company__c company1 = new Company__c(Company_Name__c = 'Test Company Name', Organization__c = org.Id);
        Company__c company2 = new Company__c(Company_Name__c = 'Test Company Name1', Organization__c = org.Id);
        insert new List<Company__c>{ company1, company2 };
        

        // Step 3: Create Facilities (2 matching names, 1 unmatched)
        //Facility__c fac1 = new Facility__c(Name = 'Facility Match', Facility_Name__c = 'Facility Match', Organisation__c = org.Id);
        //Facility__c fac2 = new Facility__c(Name = 'Another Match', Facility_Name__c = 'Another Match', Organisation__c = org.Id);
        //Facility__c fac3 = new Facility__c(Name = 'Unique Facility', Facility_Name__c = 'Unique Facility', Organisation__c = org.Id);
        Facility__c fac1 = new Facility__c();
            fac1.Name='Ashfield Consultants';
            fac1.Address__City__s='Crace';
            fac1.Address__Street__s = '8 Keewong Street';
            fac1.Address__StateCode__s='ACT';
            fac1.Address__PostalCode__s='2911';
            fac1.Email__c= 'testfacility1@gmail.com';
            fac1.Organisation__c= org.Id;
            fac1.Status__c=true;
            fac1.ABN__c='1223335021';
            fac1.Phone__c = '1234567890';
        
        Facility__c fac2 = new Facility__c();
            fac2.Name='Ashfield Consultants';
            fac2.Address__City__s='Crace';
            fac2.Address__Street__s = '8 Keewong Street';
            fac2.Address__StateCode__s='ACT';
            fac2.Address__PostalCode__s='2911';
            fac2.Email__c= 'testfacility2@gmail.com';
            fac2.Organisation__c= org.Id;
            fac2.Status__c=true;
            fac2.ABN__c='1223335020';
            fac2.Phone__c = '1234567891';
        
        Facility__c fac3 = new Facility__c();
            fac3.Name='Ashfield Consultants';
            fac3.Address__City__s='Crace';
            fac3.Address__Street__s = '8 Keewong Street';
            fac3.Address__StateCode__s='ACT';
            fac3.Address__PostalCode__s='2911';
            fac3.Email__c= 'testfacility3@gmail.com';
            fac3.Organisation__c= org.Id;
            fac3.Status__c=true;
            fac3.ABN__c='1223335023';
            fac3.Phone__c = '1234567892';
        insert new List<Facility__c>{ fac1, fac2, fac3 };

        Financial_Year__c fy = new Financial_Year__c();
            fy.Finanacial_Year__c = '2024-25';
            fy.End_Month__c = 'June';
            fy.Company__c = company1.Id;
        insert fy; 
        List<String> selectedCompanyIds = new List<String>{ company1.Id, company2.Id };
        
        Map<String, Object> activityStatementData = new Map<String, Object>{
            'gstAccountingMethod' => 'Cash Basis',
                'taxFileNumber' => '123456789',
                'gstCalculation' => 'Quarterly(Option1)',
                'paygWithheldPriod' => 'Monthly',  // match the key in your main method (even if typo)
                'paygIncomeTaxMethod' => 'Option 2 (Income times rate)',
                'isFringeBenefitsTax' => true,
                'isFuelTaxCredits' => true,
                'isWineEqualisationTax' => true,
                'forSales' => 'Tax Exclusive',
                'forPurchases' => 'Tax Inclusive'
         };
                        
        BAS_and_IAS__c bas = new BAS_and_IAS__c();
            bas.Company__c = company1.Id;
            bas.GST_Accounting_Method__c = (String)activityStatementData.get('gstAccountingMethod');
            bas.Tax_File_Number__c =  (String)activityStatementData.get('taxFileNumber');
            bas.GST_Calculation__c =(String)activityStatementData.get('gstCalculation');
            bas.GST_Calculation__c = (String)activityStatementData.get('gstCalculation');
            bas.PAYG_Withheld_Period__c = (String)activityStatementData.get('paygWithheldPriod'); 
            bas.PAYG_Income_Tax_Method__c = (String)activityStatementData.get('paygIncomeTaxMethod');
            bas.Fringe_Benefits_Tax__c = (Boolean)activityStatementData.get('isFringeBenefitsTax');
            bas.Fuel_Tax_Credits__c = (Boolean)activityStatementData.get('isFuelTaxCredits');
            bas.Wine_Equalisation_Tax__c = (Boolean)activityStatementData.get('isWineEqualisationTax');
            bas.For_Sales__c = (String)activityStatementData.get('forSales');
            bas.For_Purchases__c = (String)activityStatementData.get('forPurchases');
        insert bas;
    	
          Company__c company3 = new Company__c(
            Company_Name__c = 'Test Company 1',
            Organization__c = org.Id,
            ABN__c = '123456789',
            Phone_Number__c = '1234567890',
            Email__c = 'company1@test.com',
            Fax_Number__c = '0987654321',
            Tax__c = 'GST',
            Address_Latest__City__s='Crace',
           	Address_Latest__Street__s = '8 Keewong Street',
            Address_Latest__StateCode__s='ACT',
           	Address_Latest__PostalCode__s='2911'
           // Address__c = '8 King Street, Devonport, TAS, Australia, 7310'
        );
        insert company3;
		List<String> selectedCompanyIds1 = new List<String>{ company3.Id };
        Company__c company4 = new Company__c(
            Company_Name__c = 'Test Company 2',
            Organization__c = org.Id,
            ABN__c = '987654321',
            Phone_Number__c = '9876543210',
            Email__c = 'company2@test.com',
            Fax_Number__c = '0123456789',
            Tax__c = 'Income Tax',
            //Address__c = '8 King Street, Devonport, TAS, Australia, 7310'
            Address_Latest__City__s='Crace',
           	Address_Latest__Street__s = '8 King Street',
            Address_Latest__StateCode__s='ACT',
           	Address_Latest__PostalCode__s='2911'
        );
        insert company4;
        
       /*Entity_Profile__c supplier = new Entity_Profile__c(
            Card_Type__c = 'Supplier',
            Company__c = company4.Id
        );

        Entity_Profile__c customer = new Entity_Profile__c(
            Card_Type__c = 'Customer',
            Company__c = company4.Id
        );

        insert new List<Entity_Profile__c>{ supplier, customer };*/
        // Create Customer profile
        Entity_Profile__c customerProfile = new Entity_Profile__c(
            Name__c = 'Customer Entity',
            First_Name__c = 'Jane',
            Last_Name__c = 'Doe',
            Card_Type__c = 'Customer',
            Company__c = company3.Id,
            Contact__c = '1234567890',
            Designation__c = 'Individual'
        );

        // Create Supplier profile
        Entity_Profile__c supplierProfile = new Entity_Profile__c(
            Name__c = 'Supplier Entity',
            First_Name__c = 'John',
            Last_Name__c = 'Smith',
            Card_Type__c = 'Supplier',
            Company__c = company3.Id,
            Contact__c = '9876543210',
            Designation__c = 'Individual'
        );

        insert new List<Entity_Profile__c>{ customerProfile, supplierProfile };
        
        Account_List__c acc = new Account_List__c(
            Industry__c = 'Service',
            Company__c = company3.Id
        );
         /*Account_List__c acc1 = new Account_List__c(
            Industry__c = 'Companies',
            Company__c = company4.Id
        );
         insert new List<Account_List__c>{ acc, acc1 };*/
       insert acc;
        
        // Step 4: Call the method
        Test.startTest();
            List<Facility__c> unmatchedFacilities = CreateCompanyController.getFacility(org.Id);
            CreateCompanyController.insertCompany(fac1.Id);
            CreateCompanyController.saveFinancialYearApex(selectedCompanyIds1,'2024-25','June');
            CreateCompanyController.saveActivityStatement(company1.Id,activityStatementData);
            List<Company__c> result1 = CreateCompanyController.getCompany(company3.Id, null);
            List<Company__c> result2 = CreateCompanyController.getCompany(null, org.Id);
            Boolean count = CreateCompanyController.checkCompanyName(company3.Company_Name__c);
           
            //CreateCompanyController.getUserOrganisation();
           // Map<String, String> result = CreateCompanyController.getProfileId();
        	Map<String, Object> res = CreateCompanyController.getProfiles(company3.Id);
          	String res1 = CreateCompanyController.insertAccountList(company3.Id, 'Service');
         	String res2 = CreateCompanyController.insertAccountList(company4.Id, 'Companies');
        	List<Map<String, Object>> finalList = CreateCompanyController.getAccountingData('Service');
        	List<Map<String, Object>> finalList1 = CreateCompanyController.getAccountingData('Companies');
        	List<Map<String, Object>> finalList2 = CreateCompanyController.getAccountingData('NDIS');
         //	List<Company__c> companyResult = CreateCompanyController.getCompanyForEntity(company3.Id);
        Test.stopTest();  
        
       
    }
    @isTest
    static void testGetUserOrganisation() {
        Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
    	System.runAs(u) {
            Test.startTest();
            Organisation__c orgRecord = CreateCompanyController.getUserOrganisation();
           
            Test.stopTest();
        }
    }
    	

}