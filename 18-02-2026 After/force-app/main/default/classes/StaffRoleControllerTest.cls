@isTest
private class StaffRoleControllerTest {
    
    // Helper to get a valid picklist value
    private static String getPickVal(Schema.SObjectType obj, String fieldAPI) {
        Schema.DescribeFieldResult f = obj.getDescribe().fields.getMap().get(fieldAPI).getDescribe();
        List<Schema.PicklistEntry> vals = f.getPicklistValues();
        return vals.isEmpty() ? null : vals[0].getValue();
    }
    
    @testSetup
    static void setupData() {
        
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
        fac.ABN__c ='12345566666';
        fac.Phone__c = '12323432';
        fac.Type_of_Service__c = 'NDIS';
        insert fac;
        
        Staff__c staff = new Staff__c();
        staff.Last_Name__c='Test staff';
        staff.Name='praveen1';
        staff.Name__c='abcd';
        staff.Contact_Number__c='56789908743';
        staff.Email_Address__c= 'manualtesting.20294637@hotmail.com';
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
        insert staff;
        
        StaffRole__c sr = new StaffRole__c(
            StaffRole_To_Staff__c = staff.Id,
            RoleName__c = 'Support Worker',
            Active__c = true,
            Hourly_Rate__c = 50
        );
        insert sr;
        Staff_Facility__c sf = new Staff_Facility__c(
            Staff__c = staff.Id,
            Facility__c = fac.Id,
            Active__c = true
        );
        insert sf;
    }
    
    @isTest
    static void testGetStaffRoles() {
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        StaffRoleController.getStaffRoles(staff.Id);
        StaffRoleController.getStaffRoles(null);
    }
    
    @isTest
    static void testGetStaffRoleWithRates() {
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        
        StaffRoleController.getStaffRoleWithRates(staff.Id, 'Support Worker', fac.Id);
        StaffRoleController.getStaffRoleWithRates(staff.Id, null, fac.Id);
        StaffRoleController.getStaffRoleWithRates(null, 'Support Worker', fac.Id);
    }
    
    @isTest
    static void testCreateStaffRoles() {
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        
        String catType = getPickVal(StaffRole__c.SObjectType, 'Category_Type__c');
        String classLvl = getPickVal(StaffRole__c.SObjectType, 'Classification_Level__c');
        String classPay = getPickVal(StaffRole__c.SObjectType, 'Classification_Pay_Point__c');
        String jobType  = getPickVal(StaffRole__c.SObjectType, 'Type_of_Job__c');
        
        List<StaffRoleController.staffRoleFacilityWrapper> wrappers =
            new List<StaffRoleController.staffRoleFacilityWrapper>();
        
        StaffRoleController.staffRoleFacilityWrapper w =
            new StaffRoleController.staffRoleFacilityWrapper();
        w.roleId = null;
        w.value = 'Support Worker';
        w.facilityValue = fac.Id;
        w.isActive = true;
        
        wrappers.add(w);
        
        String selectedRolesJson = JSON.serialize(wrappers);
        
        Test.startTest();
        StaffRoleController.createStaffRoles(
            staff.Id,
            selectedRolesJson,          
            'Support Worker',
            45, 47, 50, 60, 48, 52, 25,
            catType, classLvl, classPay, jobType,
            fac.Id                      
        );
        Test.stopTest();
    }
    
    @isTest
    static void testGetSelectedRole() {
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        StaffRoleController.getSelectedRole(staff.Id);
        StaffRoleController.getSelectedRole(null);
    }
    
    @isTest
    static void testGetActiveStaffRoles() {
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        StaffRoleController.getActiveStaffRoles(staff.Id);
        StaffRoleController.getActiveStaffRoles(null);
    }
}