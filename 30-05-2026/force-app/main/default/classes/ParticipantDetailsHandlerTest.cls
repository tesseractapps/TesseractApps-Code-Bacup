@isTest
public class ParticipantDetailsHandlerTest {

    @isTest
    static void TestClientData() {

        Profile prof = [
            SELECT Id
            FROM Profile
            WHERE Name LIKE '%Admin%'
            LIMIT 1
        ];

        User usr = new User(
            Alias = 'testusr',
            Email='ptestuser@mail.com',
            EmailEncodingKey='UTF-8',
            LastName='Testing',
            LanguageLocaleKey='en_US',
            LocaleSidKey='en_US',
            ProfileId = prof.Id,
            TimeZoneSidKey='America/New_York',
            UserName='ptestuser@mail.com'
        );

        insert usr;

        System.runAs(usr) {


        Organisation__c org = new Organisation__c();
        org.Name='Ashfield Consultants';
        org.ABN__c='12345678987';
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

            Facility__c fac = new Facility__c();
            fac.Name='Ashfield Consultants';
            fac.Address__City__s='Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s='ACT';
            fac.Address__PostalCode__s='2911';
            fac.Address__CountryCode__s='AU';
            fac.Email__c= 'testonefacility@gmail.com';
            fac.Status__c=true;
            fac.Organisation__c= org.Id;
            fac.ABN__c='12345678987';
            fac.Phone__c = '12323432';
            fac.Phone__c = '12323432';
            fac.Type_of_Service__c='Ndis';
            insert fac;

 Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test staff'; 
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'ptestuser@mail.com';
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
            staff.Final_Overall_Rate__c=150;
            staff.Saturday_Hourly_Rate__c = 130;
            staff.Sunday_Hourly_Rate__c = 50;
            staff.Status__c = true;
            
           // staff.Role__c = 'Support Worker';
            insert staff; 

            Direction__c dire = new Direction__c(
                Name='Direction'
            );

            insert dire;

            Add_Shift__c shift = new Add_Shift__c();
            shift.Start_Date__c = Date.today();
            shift.End_Date__c = Date.today();
            shift.Direction__c = dire.Id;
            shift.Role__c = 'Admin';
            shift.Get_Facility__c = true;
            shift.Quantity__c = 1;
            shift.Start_Time__c = Time.newInstance(9,0,0,0);
            shift.End_Time__c = Time.newInstance(17,0,0,0);
            shift.Facility__c = fac.Id;
            shift.Status__c = 'Draft';
            shift.Location__StateCode__s = 'ACT';
            shift.Location__CountryCode__s = 'AU';
            shift.Location__PostalCode__s = '2911';
            shift.Shift_Type__c = 'General';

            insert shift;

            Client__c cli =  new Client__c();
            cli.First_Name__c = 'Test';
            cli.Last_Name__c = 'Participant2948';
            cli.Gendar__c = 'Male';
            cli.Date_Of_Birth__c = Date.newInstance(1991, 2, 17);
            cli.Address__Street__s='8 Keewong Street';
            cli.Address__City__s = 'Crace';
            cli.Address__StateCode__s='ACT';
            cli.Address__PostalCode__s='2911';
            cli.Contact_Number__c='4331237651';
            cli.Drivers_Licence__c = '123456789012';
            cli.Primay_Contact_First_Name__c='Jason';
            cli.Primay_Contact_Last_Name__c='Smith';
            cli.Relationship__c='Parent';
            cli.Email__c='manualtesting.4139559@hotmail.com';
            cli.Primary_Contact_Number__c='0433123123';
            insert cli;

            Client_Journel__c journel =
                new Client_Journel__c();

            journel.Client__c = cli.Id;
            journel.Notes_Type__c = 'Care Notes';
            journel.Description__c =
                'Test Care Notes Description';

            insert journel;

            Test.startTest();

            ParticipantDetailsHandler.listOfClientjounel(
                cli.Id
            );

            ParticipantDetailsHandler.saveDesc(
                cli.Id,
                journel.Id,
                journel.Description__c,
                journel.Notes_Type__c,
                'Correction Test',
                shift.Id
            );

            ParticipantDetailsHandler.saveDesc(
                cli.Id,
                '',
                journel.Description__c,
                journel.Notes_Type__c,
                '',
                shift.Id
            );

            Test.stopTest();
        }
    }

    @isTest
    static void testCommunityPage() {

        Test.startTest();

        String communityUrl =
            ParticipantDetailsHandler.communityPage();

        Test.stopTest();
    }
}