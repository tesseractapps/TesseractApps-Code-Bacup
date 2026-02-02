@IsTest
public class StaffFacilityHandlerTest {
    
    @testSetup
    static void setupData() {
        
        Organisation__c org = new Organisation__c(
            Name='Ashfield Consultants1',
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
            User_Type__c='NDIS Org Admin'
        );
        insert org;
        
        Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
        
        User user = new User(
            Alias='praveen',
            Email='manualtesting.20294635557@gamil.com',
            EmailEncodingKey='UTF-8',
            LastName='StaffOne209463',
            LanguageLocaleKey='en_US',
            LocaleSidKey='en_US',
            ProfileId=prof.Id,
            TimeZoneSidKey='America/New_York',
            User_Type__c='NDIS Org Admin',
            UserName='manualtesting.20294635557@gamil.com',
            Organization_Name__c='Ashfield Consultants1'
        );
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
            
            Staff_Facility__c sf = new Staff_Facility__c(
                Staff__c = staff.Id,
                Facility__c = fac.Id,
                Active__c = true
            );
            insert sf;
            
            Participant_Facility__c pf = new Participant_Facility__c(
                Participant__c = cli.Id,
                Facility__c = fac.Id,
                Active__c = true
            );
            insert pf;
        }
    }
    
    @IsTest
    static void testUpsertStaffFacilities() {
        
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
        
        staffFacilityHandler.StaffFacilityWrapper wrapper =
            new staffFacilityHandler.StaffFacilityWrapper();
        wrapper.staffId = staff.Id;
        wrapper.selectedFacilityIds = new List<Id>{ facility.Id };
            
            Test.startTest();
        staffFacilityHandler.upsertStaffFacilities(JSON.serialize(wrapper));
        Test.stopTest();
    }
    
    @IsTest
    static void testUpsertStaffFacilitiesBulk() {
        
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
        List<String> staffId = new List<String>();
        List<Staff__c> staffs = [SELECT Id FROM Staff__c LIMIT 1];
        for(Staff__c st:staffs){
            staffId.add(st.Id);
        }
        
        staffFacilityHandler.StaffFacilityWrapper wrapper =
            new staffFacilityHandler.StaffFacilityWrapper();
        wrapper.staffId = staff.Id;
        wrapper.selectedFacilityIds = new List<Id>{ facility.Id };
            
        Test.startTest();
        staffFacilityHandler.upsertStaffFacilitiesBulk(new List<staffFacilityHandler.StaffFacilityWrapper>{ wrapper });
        staffFacilityHandler.getStaffFacilityMap(staffId);
        Test.stopTest();
    }
    
    @IsTest
    static void testUpsertParticipantFacilities() {
        
        Client__c participant = [SELECT Id FROM Client__c LIMIT 1];
        Facility__c facility = [SELECT Id FROM Facility__c LIMIT 1];
        
        staffFacilityHandler.participantFacilityWrapper wrapper =
            new staffFacilityHandler.participantFacilityWrapper();
        wrapper.participantId = participant.Id;
        wrapper.selectedFacilityIds = new List<Id>{ facility.Id };
            
            Test.startTest();
        staffFacilityHandler.upsertParticipantFacilities(
            JSON.serialize(wrapper)
        );
        Test.stopTest();
    }
    
    @IsTest
    static void testEmptyPayload() {
        
        Test.startTest();
        try {
            staffFacilityHandler.upsertStaffFacilities('');
        } catch (Exception e) {
        }
        Test.stopTest();
    }
}