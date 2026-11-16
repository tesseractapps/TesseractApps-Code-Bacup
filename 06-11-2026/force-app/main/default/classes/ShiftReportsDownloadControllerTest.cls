@IsTest
private class ShiftReportsDownloadControllerTest {

    @TestSetup
    static void setupTestData() {
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
                                 LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York',User_Type__c='Facility Admin', UserName='manualtesting.4139562@hotmail.com',Organization_Name__c ='Ashfield Consultants');
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
                fac.ABN__c='12356454331';
                fac.Phone__c = '12323213';
                insert fac;
                
                fac.ABN__c = '99999999999';
                update fac;
                            
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
                cli.Facility__c=fac.id;
                cli.Status__c=true;
                cli.Medications__c = 'Test Medication';
                cli.Allergies__c = 'Test Allergies';
                cli.Notes__c = 'Test Notes';
                cli.Unavailable_Date__c = Date.newInstance(2025, 05, 16);
                cli.Current_Availability__c  =  'Unavailable';
                // clientList.add(cli);        
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
                
                New_Support_Plan__c plan = new New_Support_Plan__c();
                plan.Client__c=cli.Id;
                insert plan;
                
                Funds_Tracker__c funds = new Funds_Tracker__c();
                funds.Registration_Group__c='Assistance Animals';
                funds.Amount_approved__c=11000;
               // funds.Available_Funds__c = 10000;	
                //funds.Spent_Amount__c = 1000;
                funds.Client__c=cli.Id;
                funds.Plan_Type__c ='Plan Managed';
                funds.Approved_Date__c = Date.newInstance(2024, 03, 16);
                insert funds;
                
                NDIS_Support_Catalogue__c NSC = new NDIS_Support_Catalogue__c();
                NSC.Name = 'Assistance Animals';
                NSC.ACT__c = 100;
                NSC.NSW__c =100;
                NSC.NT__c = 100;
                NSC.QLD__c = 100;
                NSC.SA__c = 100;
                NSC.TAS__c = 100;
                NSC.VIC__c = 100;
                NSC.WA__c = 100;
                insert NSC; 
                                        
              
                
                New_Support_Plan__c newSupport = new New_Support_Plan__c(Client__c = cli.Id);
                insert newSupport;
                
               /* ClientFundTrackerJN__c clientJunction = new ClientFundTrackerJN__c();
                clientJunction.Funds_Tracker__c = funds.Id;
                clientJunction.Participant__c = cli.Id;
                clientJunction.State__c = 'ACT__c';
                clientJunction.NDIS_Support_Catalogue__c = newSupport.Id;
                insert newSupport; */
                
                Service_Invoice__c si = new Service_Invoice__c();
                si.Amazon_Service_URL__c = 'https://datainfo.s3.ap-southeast-2.amazonaws.com/inv-00033.pdf';
                si.Date_of_Invoice__c =  SYSTEM.TODAY();
                si.User_Name__c	= 'Staff Seven';
                insert si;
                
                Direction__c dire = new Direction__c();
                dire.Name='Test Directions';
                insert dire;
                
                Add_Shift__c shift = new Add_Shift__c();
                shift.Break__c = '30';
                shift.Do_you_want_to_set_this_a_recurring_shif__c=true;
                shift.Start_Date__c =Date.newInstance(2024, 03, 16);        
                shift.Direction__c=dire.Id;
                //shift.Role__c='Admin';
                shift.Get_Facility__c=true;
                shift.Quantity__c=5;
                shift.Start_Time__c=Time.newInstance( 03, 30, 00, 00);
                shift.End_Time__c=Time.newInstance( 05, 00, 00, 00);
                shift.Facility__c=fac.Id;
                shift.Status__c='Draft';
                shift.Start_time_picklist__c='3:30 am';
                shift.End_time_picklist__c='5:00 am';
                shift.Location__StateCode__s = 'ACT';
                shift.Location__CountryCode__s = 'AU';
                shift.Location__PostalCode__s = '2911';
                insert shift; 
                
                Add_Shift__c shift1 = new Add_Shift__c();
                shift1.Break__c = '30';
                shift1.Do_you_want_to_set_this_a_recurring_shif__c=true;
                shift1.Start_Date__c =Date.newInstance(2024, 10, 16);        
                shift1.Direction__c=dire.Id;
              //  shift1.Role__c='Admin';
                shift1.Get_Facility__c=true;
                shift1.Quantity__c=5;
                shift1.Start_Time__c=Time.newInstance( 03, 30, 00, 00);
                shift1.End_Time__c=Time.newInstance( 05, 00, 00, 00);
                shift1.Facility__c=fac.Id;
                shift1.Status__c='Draft';
                shift1.Start_time_picklist__c='3:30 am';
                shift1.End_time_picklist__c='5:00 am';
                shift1.Location__StateCode__s = 'ACT';
                shift1.Location__CountryCode__s = 'AU';
                shift1.Location__PostalCode__s = '2911';
                shift1.Shift_Type__c='General';
                insert shift1;
                
                ShiftwithStaff__c staffs = new ShiftwithStaff__c();
                staffs.Add_Shift__c=shift.Id;
                staffs.Attendence__c=true;
                staffs.Comments__c = 'test comments';
                staffs.Staff__c=staff.Id;
                staffs.Role__c='Admin';
                staffs.Status__c='Accepted';
                staffs.Log_In_Date_Time__c = Time.newInstance( 3, 30, 00, 00);
                staffs.Log_Out_Date_Time__c = Time.newInstance( 5, 00, 00, 00);
               // staffs.End_Time__c=system.now();
                insert staffs; 
    
            // Checklist record
            Add_Shift_Checklist__c chk = new Add_Shift_Checklist__c(
                ShiftwithStaff__c = staffs.Id,
                Description__c = 'Medication administered',
                Mandatory__c = true
            );
            insert chk;
        }
    }
    
    @IsTest
    static void testShiftReportsDownloadController() {
        // Get sample shift Id
        ShiftwithStaff__c shift = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];

        // Set Page Parameters
        Test.startTest();
        PageReference pageRef = Page.ShiftReportsDownloadPdf; // Replace with your actual VF page name
        Test.setCurrentPage(pageRef);
        ApexPages.currentPage().getParameters().put('shiftId', shift.Id);

        // Instantiate Controller
        ShiftReportsDownloadController controller = new ShiftReportsDownloadController();
        Test.stopTest();
    }

    @IsTest
    static void testShiftIdMissingBehavior() {
        // Test missing shiftId
        Test.startTest();
        PageReference pageRef = Page.ShiftReportsDownloadPdf;
        Test.setCurrentPage(pageRef);
        // Do not provide shiftId intentionally
        ShiftReportsDownloadController controller = new ShiftReportsDownloadController();
        Test.stopTest();
    }
    
    @IsTest
    static void testReimbursementItemConstructor() {
        // Test data
        String vehicleType = 'Car';
        Decimal amountValue = 120.50;
        String comments = 'Fuel and Toll charges';
        String approvalStatus = 'Approved';
        
        // Create instance of ReimbursementItem
        ShiftReportsDownloadController.ReimbursementItem item = 
            new ShiftReportsDownloadController.ReimbursementItem(vehicleType, amountValue, comments, approvalStatus);
    }
}