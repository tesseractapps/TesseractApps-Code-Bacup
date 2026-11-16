@isTest
public class PayrunSettingHandlerTest {

    @testSetup
    static void setupData() {

        Organisation__c org = new Organisation__c();
        org.Name = 'Ashfield Consultants';
        org.ABN__c = '11234567891';
        org.ACN__c = '878787878';
        org.Contact_No__c = '6132899740';
        org.RCTI__c = 'RCTI1';
        org.Email__c = 'dsfdsfsd@gmail.com';
        org.Bank__c = 'Bank Test';
        org.BSB__c = 'BSB Test';
        org.Account_Name__c = 'Test Account';
        org.Account_Number__c = '1111111111';
        org.Description__c = 'test Desc';
        org.Address_Latest__Street__s = '101';
        org.Address_Latest__City__s = 'Himas Waterhen';
        org.Address_Latest__PostalCode__s = '2060';
        org.Address_Latest__CountryCode__s = 'AU';
        org.Address_Latest__StateCode__s = 'NSW';
        org.NDIS_Provider__c = '12341234565';
        org.BMSI_Identifier__c = 'TEST BMSI';
        org.SoftwareId__c = 'jhdfn18328';
        org.Branch_code__c = 'BS123';
        org.Contact_Name__c = 'Test Contact';
        org.User_Type__c = 'NDIS Org Admin';
        insert org;

        Profile p = [
            SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1
        ];

        User u = new User(
            Alias = 'payrun',
            Email = 'payrun@test.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'Payrun',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = p.Id,
            TimeZoneSidKey = 'Asia/Kolkata',
            Username = 'payrun' + System.currentTimeMillis() + '@test.com',
            Organization_Name__c = org.Name
        );
        insert u;

        System.runAs(u) {

            Facility__c fac = new Facility__c();
            fac.Name = 'Ashfield Consultants';
            fac.Address__City__s = 'Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s = 'ACT';
            fac.Address__PostalCode__s = '2911';
            fac.Address__CountryCode__s = 'AU';
            fac.Email__c = 'testonefacility@gmail.com';
            fac.Status__c = true;
            fac.Organisation__c = org.Id;
            fac.ABN__c = '12345566666';
            fac.Phone__c = '12323432';
            insert fac;

            List<Staff__c> staffList = new List<Staff__c>();

            for (Integer i = 0; i < 3; i++) {
                Staff__c s = new Staff__c();
                s.Last_Name__c = 'Test Staff';
                s.Name = 'Staff' + i;
                s.Name__c = 'Staff' + i;
                s.Contact_Number__c = '5678990874' + i;
                s.Email_Address__c = 'staff' + i + '@test.com';
                s.Facility__c = fac.Id;
                s.Address__Street__s = '8 Keewong Street';
                s.Address__City__s = 'Crace';
                s.Address__StateCode__s = 'ACT';
                s.Address__PostalCode__s = '2911';
                s.Emergency_Phone_Number__c = '45678766675';
                s.Primary_Contact_Name__c = 'Praveen';
                s.Primary_Contact_Number__c = '9908458298';
                s.Make_Primary_as_Approver__c = true;
                s.Primary_Contact_Email__c = 'praveen@test.com';
                s.Secondary_Contact_Name__c = 'Maheswari';
                s.Secondary_Contact_Email__c = 'maheswari@test.com';
                s.Make_Secondary_as_Approver__c = false;
                s.Secondary_Contact_Number__c = '99084582958';
                s.Emp_exit_date__c = Date.newInstance(2028, 1, 5);
                s.Emp_Start_Date__c = Date.newInstance(2023, 2, 1);
                s.Payee_ETP_Payment_Date__c = Date.newInstance(2025, 2, 4);
                s.Date_Of_Birth__c = Date.newInstance(2001, 2, 4);
                s.Role__c = 'Admin';
                s.Residency_Type__c = 'Australian';
                s.Expiry_Date__c = Date.newInstance(2025, 2, 19);
                s.Type__c = 'Visa Status';
                s.Working_Hours_Rate__c = 50;
                s.Final_Overall_Rate__c = 150;
                s.Saturday_Hourly_Rate__c = 130;
                s.Sunday_Hourly_Rate__c = 50;
                s.Status__c = true;
                staffList.add(s);
            }
            insert staffList;

            Payroll_Setting__c ps = new Payroll_Setting__c();
            ps.Group_Name__c = 'Test Group';
            ps.Frequency__c = 'Weekly';
            ps.Status__c = '';
            ps.Period_Start_Date__c = System.today().addDays(-7);
            ps.Period_End_Date__c = System.today();
            ps.Next_Pay_Date__c = System.today().addDays(2);
            ps.Facility__c = fac.Id;
            ps.Organization__c = org.Id;
            insert ps;

            List<Staff_Payroll_Setting__c> spsList = new List<Staff_Payroll_Setting__c>();
            for (Staff__c st : staffList) {
                Staff_Payroll_Setting__c sps = new Staff_Payroll_Setting__c();
                sps.Staff__c = st.Id;
                sps.Payroll_Setting__c = ps.Id;
                sps.Frequency__c = 'Weekly';
                sps.Working_Hours__c = 40;
                spsList.add(sps);
            }
            insert spsList;
        }
    }

    @isTest
    static void testPayrunHandler() {

        User u = [
            SELECT Id FROM User 
            WHERE Organization_Name__c = 'Ashfield Consultants'
            LIMIT 1
        ];

        System.runAs(u) {

            Payroll_Setting__c ps = [SELECT Id FROM Payroll_Setting__c LIMIT 1];
            Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];

            Test.startTest();

            PayrunSettingHandler.staffPayroll(ps.Id);
            PayrunSettingHandler.staffPayrollDate(ps.Id);
            PayrunSettingHandler.accpetedStaffPayroll(ps.Id);
            PayrunSettingHandler.fetchFacilitiesByOrgId();
            PayrunSettingHandler.getpPaySettings();
            PayrunSettingHandler.newStaffList(ps.Id);
            PayrunSettingHandler.payrollRun('Weekly');
            PayrunSettingHandler.payrollRun('');
            PayrunSettingHandler.getLastPayDate(fac.Id);

            List<String> staffIds = new List<String>();
            for (Staff__c s : [SELECT Id FROM Staff__c LIMIT 2]) {
                staffIds.add(s.Id);
            }
            String staffJson = JSON.serialize(staffIds);
            String today = String.valueOf(System.today());

            PayrunSettingHandler.insertInvoice(
                staffJson,
                staffJson,
                fac.Id,
                today,
                today,
                today,
                'Weekly',
                'Test Group'
            );

            PayrunSettingHandler.updatePayset(ps.Id, staffJson);

            Test.stopTest();
        }
    }
}