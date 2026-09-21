@isTest
public class ShiftTypeTimingsTest {
    
    @TestSetup
    static void setup() {
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
        
        //system.debug(org.name);
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.206684@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne272', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', 
                             UserName='manualtesting.206684@hotmail.com',Organization_Name__c ='Ashfield Consultants',
                            Mobile_device_token__c='ea3IXUVETReHewkaKbcOv8:APA91bETTO2Y0CGo6DLEwBv1JfIHfmZHW1cRBSqrJsww8BvSrw-MGUGB2PMzU9Q6-P3t17Y7cP-uXFYoIVpchu1YlHEfKATnhE1mtnDmPTp5WreDn4YQ6xrULj3294JrllbuYOuSV6w_'
                           );
        insert user;
        
        System.runAs(user){   
 
            Facility__c fac = new Facility__c();
            fac.Name='Ashfield Facility';
            fac.Address__City__s='Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s='ACT';
            fac.Address__PostalCode__s='2911';
            fac.Address__CountryCode__s='AU';
            fac.Email__c= 'testonefacility111@gmail.com';
            fac.Status__c=true;
            fac.Organisation__c= org.Id;
            fac.ABN__c='3673232323';
            fac.Phone__c = '123123123';
            insert fac;
            
            Shift_Type__c shiftType = new Shift_Type__c(
            Name = 'Morning',
            Facility__c = fac.Id,
            Start_Time__c = Time.newInstance(9, 0, 0, 0),
            End_Time__c   = Time.newInstance(17, 0, 0, 0),
            Shift_Type__c = 'Morning',
            Colour__c = '#222222'
        );
        insert shiftType;
        }
    }

    @IsTest
    static void testSaveMultipleShifts() {
        // Fetch the test facility
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];

        // Prepare Default shifts data
        List<Map<String, Object>> defaultShifts = new List<Map<String, Object>>();
        defaultShifts.add(new Map<String, Object>{
            'Name' => 'Default Shift 1',
            'Start_Time__c' => '08:00',
            'End_Time__c'   => '12:00',
             'Facility__c' =>fac.Id
        });

        // Prepare Own shifts data
        List<Map<String, Object>> ownShifts = new List<Map<String, Object>>();
        ownShifts.add(new Map<String, Object>{
            'Name' => 'Own Shift 1',
            'Start_Time__c' => '13:00',
            'End_Time__c'   => '17:00',
             'Facility__c' =>fac.Id
        });

        // Prepare Custom shifts data (with children)
        List<Map<String, Object>> customShifts = new List<Map<String, Object>>();
        Map<String, Object> customGroup = new Map<String, Object>();
        customGroup.put('customShiftName', 'Custom Shift Group 1');
        customGroup.put('selectedColor', 'Red');
        customGroup.put('Facility__c', fac.Id);

        List<Map<String, Object>> childShifts = new List<Map<String, Object>>();
        childShifts.add(new Map<String, Object>{
            'name' => 'Child Shift 1',
            'type' => 'Morning',
            'startTime24' => '09:00',
            'endTime24'   => '11:00',
            'displayIndex' => 1
        });
        childShifts.add(new Map<String, Object>{
            'name' => 'Child Shift 2',
            'type' => 'Morning',
            'startTime24' => '11:00',
            'endTime24'   => '13:00',
            'displayIndex' => 2
        });

        customGroup.put('shifts', childShifts);
        customShifts.add(customGroup);

        Test.startTest();

        List<Shift_Type__c> result = ShiftTypeTimings.saveMultipleShifts(
            defaultShifts,
            ownShifts,
            customShifts,
            10.5, // costPerKmElectric
            15.0, // costPerKmFuel
            fac.Id
        );

        Test.stopTest();
        // Check Facility update
        Facility__c updatedFac = [SELECT Cost_per_Km_Electric__c, Cost_per_Km_Fuel__c FROM Facility__c WHERE Id = :fac.Id];
        // Check Custom Parent
        Shift_Type__c customParent = [SELECT Name, Type_of_Shift__c, Start_Time__c, End_Time__c, Colour__c FROM Shift_Type__c WHERE Type_of_Shift__c = 'Custom' LIMIT 1];
       
        // Check Child Records
        List<Custom_Shift_Timings__c> childRecs = [SELECT Name, Start_Time__c, End_Time__c, Custom_Shift_Type__c FROM Custom_Shift_Timings__c WHERE Custom_Shift_Type__c = :customParent.Id];
        
    }

    @IsTest
    static void testSaveMultipleShiftsWithEmptyLists() {
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];

        Test.startTest();
        List<Shift_Type__c> result = ShiftTypeTimings.saveMultipleShifts(
            new List<Map<String,Object>>(),
            null,
            null,
            null,
            null,
            fac.Id
        );
//ShiftNameAssignClass.assignShiftName();
        Test.stopTest();

     }

}