@isTest
public class RiskBatchTest {
    @isTest
    static void testBatchAndHelperWithRiskRecords() {
        // Step 1: Create test org, facility, user, and participant 	
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
        org.User_Type__c = 'NDIS Org Admin';
        insert org;
        system.debug(org.name);
        
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.4139562@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='Test Friday4039562', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.4139562@hotmail.com',Organization_Name__c ='Ashfield Consultants');
        insert user;
        
        System.runAs(user) {         
            Facility__c fac = new Facility__c();
            fac.Name='Ashfield Consultants';
            fac.Address__City__s='Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s='ACT';
            fac.Address__PostalCode__s='2911';
            fac.Address__CountryCode__s='AU';
            fac.Email__c= 'testonefacility111@gmail.com';
            fac.Status__c=true;
            fac.Organisation__c= org.Id;
            fac.ABN__c='1235645433';
            fac.Phone__c = '12323213';
            insert fac;
                        
           Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test staff';
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtesting.4139562@hotmail.com';
            staff.Facility__c=fac.Id;
            staff.Address__Street__s='8 Keewong Street';
            staff.Address__City__s = 'Crace';
            staff.Address__StateCode__s='ACT';
            staff.Address__PostalCode__s='2911';
            staff.Emergency_Phone_Number__c='45678766675';
            staff.Primary_Contact_Name__c='Praveen';
            staff.Primary_Contact_Number__c='9908458298';
            staff.Make_Primary_as_Approver__c=true;
            staff.Primary_Contact_Email__c='praveenshesham.sp@gmail.com';
            staff.Secondary_Contact_Name__c='maheswari';
            staff.Secondary_Contact_Email__c='maheswari.adabala@gmail.com';
            staff.Make_Secondary_as_Approver__c=false;
            staff.Secondary_Contact_Number__c='99084582958';
            staff.Emp_exit_date__c = date.newInstance(2028, 01, 05);
            staff.Emp_Start_Date__c = date.newInstance(2023, 02, 01);
            staff.Payee_ETP_Payment_Date__c = date.newInstance(2025, 02, 04);
            staff.Date_Of_Birth__c = date.newInstance(2001, 02, 04);
            staff.role__c='Admin';
            staff.Residency_Type__c = 'Australian';
            staff.Expiry_Date__c = date.newInstance(2025,02, 19);
            staff.Type__c = 'Visa Status';
            staff.Working_Hours_Rate__c=50;
            staff.Annual_Leave__c=10;
            staff.Sick_Leave__c=2;
            staff.Bereavement_Leave__c=10;
            staff.Parental_Leave__c=3;
            insert staff; 

        Client__c cli = new Client__c(
            First_Name__c = 'Test',
            Last_Name__c = 'Participant2948',
            Gendar__c = 'Male',
            Date_Of_Birth__c = Date.newInstance(1991, 2, 17),
            Address__Street__s = '8 Keewong Street',
            Address__City__s = 'Crace',
            Address__StateCode__s = 'ACT',
            Address__PostalCode__s = '2911',
            Contact_Number__c = '4331237651',
            Drivers_Licence__c = '123456789012',
            Primay_Contact_First_Name__c = 'Jason',
            Primay_Contact_Last_Name__c = 'Smith',
            Relationship__c = 'Parent',
            Email__c = 'manualtesting.4139559@hotmail.com',
            Primary_Contact_Number__c = '0433123123',
            Facility__c = fac.Id,
            Status__c = true,
            Medications__c = 'Test Medication',
            Allergies__c = 'Test Allergies',
            Notes__c = 'Test Notes',
            Unavailable_Date__c = Date.newInstance(2025, 05, 16),
            Current_Availability__c = 'Unavailable'
        );
        insert cli;

        // Step 2: Create Risk_Management__c records (children)
        List<Risk_Management__c> risks = new List<Risk_Management__c>{
            new Risk_Management__c(
                Area__c = 'Behavioural',
                Category__c = 'Aggression',
                Impact_on_Whom__c = 'Participant',
                Likelihood__c = 'Frequent',
                Consequences__c = 'Insignificant',
                Risk_Index__c = 'High',
                Risk_Strategy__c = 'Mitigate',
                Person_Responsible__c = 'Coordinator',
                Date_Completed__c = Date.today(),
                Participant__c = cli.Id,
                UniqueRefId__c = 'RISK001',
                File_Name__c = 'risk_doc_001.pdf',
                Other_Text__c = 'Additional notes'
            ),
            new Risk_Management__c(
                Area__c = 'Behavioural',
                Category__c = 'Aggression',
                Impact_on_Whom__c = 'Participant',
                Likelihood__c = 'Frequent',
                Consequences__c = 'Insignificant',
                Risk_Index__c = 'Extreme',
                Risk_Strategy__c = 'Mitigate',
                Person_Responsible__c = 'Manager',
                Date_Completed__c = Date.today(),
                Participant__c = cli.Id,
                UniqueRefId__c = 'RISK002',
                File_Name__c = 'risk_doc_002.pdf',
                Other_Text__c = 'Follow-up required'
            )
        };
        insert risks;

        // Step 3: Execute the batch
        Test.startTest();
        Database.executeBatch(new RiskStatusUpdateBatch(), 1);
        Test.stopTest();

    
    }
    }
}