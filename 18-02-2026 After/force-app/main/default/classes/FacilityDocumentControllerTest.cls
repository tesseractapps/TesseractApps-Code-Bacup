@IsTest
private class FacilityDocumentControllerTest {
    @testsetup 
    Static void testData(){
          List<String> picklistRoles = new List<String>();

        if (picklistRoles.isEmpty()) {
            picklistRoles.addAll(new List<String>{'Admin', 'AIN'});
        }
        
        // Select first 2 valid roles safely
        String role1 = picklistRoles[0];
        String role2 = picklistRoles.size() > 1 ? picklistRoles[1] : role1;
        
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
          org.Roles__c = role1 + ';' + role2;
        insert org;
        
        //system.debug(org.name);
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.20294637@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne209463', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', 
                             User_Type__c='NDIS Org Admin', UserName='manualtesting.20294637@hotmail.com',Organization_Name__c ='Ashfield Consultants');
        insert user;
        
        System.runAs(user){   
            
            
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
            fac.ABN__c='12234567';
            fac.Phone__c = '12323432';
            fac.ABN__c='12234567';
            fac.Phone__c = '12323432';
            fac.Type_of_Service__c='Ndis';
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
           // staff.Role__c = 'Support Worker';
            insert staff; 
            
            StaffRole__c sr = new StaffRole__c(
                StaffRole_To_Staff__c = staff.Id,
                RoleName__c = 'Admin',
                Active__c = true,
                Hourly_Rate__c = 50
            );
            insert sr;
            
            Child_Staff__c cs = new Child_Staff__c();
            cs.Expiry_Date__c =date.newInstance(2028, 01, 05); 
            cs.Staff__c=staff.id;
            cs.Comments__c='test ';
            insert cs;
            
            Training__c tra = new Training__c();             
            tra.description__c	= 'Test Description';
            tra.Name = 'LWC';
            tra.start_date__c=date.newInstance(2025, 02, 05);
            tra.end_date__c=date.newInstance(2025, 02, 20);
            tra.Organization_Name__c = 'Ashfield Consultants';
            insert tra;
            
            Assignment__c assign = new Assignment__c();
            assign.Module_Name__c = tra.Id;
            assign.Staff__c = staff.Id;
            assign.Completed_Date__c=date.newInstance(2025, 02, 14);
            assign.Organization_Name__c = 'Ashfield Consultants';
            insert assign;
            
            Direction__c dire = new Direction__c();
            dire.Name='Test Directions';
            insert dire;
            
            Add_Shift__c shift = new Add_Shift__c();
            shift.Break__c = '30';
            shift.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift.Start_Date__c =Date.newInstance(2024, 10, 16);
            shift.End_Date__c=Date.newInstance(2024, 10, 24);
            shift.Direction__c=dire.Id;
            shift.Role__c='Admin';
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
            shift.Is_EOI__c = true;
            shift.EOI_staff__c = staff.Id;
            shift.Shift_Type__c='General';
            insert shift;
            
            Add_Shift_Checklist__c  asch = new Add_Shift_Checklist__c();
            asch.Description__c=' teststs ';
            asch.Mandatory__c = true;
            asch.Add_Shift__c=shift.Id;
            insert asch;
            
            ShiftwithStaff__c staffs = new ShiftwithStaff__c();
            staffs.Add_Shift__c=shift.Id;
            staffs.Attendence__c=true;
            staffs.Comments__c = 'test comments';
            staffs.Staff__c=staff.Id;
            staffs.Role__c='Admin';
            staffs.Status__c='Accepted';
            staffs.Log_In_Date_Time__c = Time.newInstance(01, 30, 00, 00);
            staffs.Log_Out_Date_Time__c = Time.newInstance(10, 00, 00, 00);
           // staffs.Long_Afternoon_Start_Time__c= Time.newInstance(01, 30, 00, 00);
          //  staffs.Long_Afternoon_End_Time__c=Time.newInstance(01, 30, 00, 00);
            insert staffs;
            
            Add_Shift__c shift1 = new Add_Shift__c();
            shift.Break__c = '30';
            shift1.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift1.Start_Date__c =Date.newInstance(2024, 12, 16); 
            shift.End_Date__c=Date.newInstance(2024, 10, 24);
            shift1.Role__c='Admin';
            shift1.Get_Facility__c=true;
            shift1.Quantity__c=5;
            shift1.Start_Time__c=Time.newInstance( 18, 30, 00, 00);
            shift1.End_Time__c=Time.newInstance(22, 00, 00, 00);
            shift1.Facility__c=fac.Id;
            shift1.Status__c='Draft';
            shift1.Start_time_picklist__c='6:30 pm';
            shift1.End_time_picklist__c='10:00 pm';
            shift1.Location__StateCode__s = 'ACT';
            shift1.Location__CountryCode__s = 'AU';
            shift1.Location__PostalCode__s = '2911';
            shift1.Shift_Type__c='Night';
            shift1.Start_Time_Text__c = '6:30 pm';
            shift1.End_Time_Text__c = '10:00 pm';
            shift1.Split_Shifts__c = true;
            insert shift1;
            
            Add_Shift_Checklist__c  asch1 = new Add_Shift_Checklist__c();
            asch1.Description__c=' teststs ';
            asch1.Mandatory__c = true;
            asch1.Add_Shift__c=shift1.Id;
            insert asch1;
            
            Add_Shift__c shift2 = new Add_Shift__c();
            shift2.Break__c = '30';
            shift2.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift2.Start_Date__c =Date.newInstance(2024, 08, 20);        
            shift2.Role__c='Admin';
            shift2.Get_Facility__c=true;
            shift2.Quantity__c=5;
            shift2.Start_Time__c=Time.newInstance( 18, 30, 00, 00);
            shift2.End_Time__c=Time.newInstance(22, 00, 00, 00);
            shift2.Facility__c=fac.Id;
            shift2.Status__c='Draft';
            shift2.Start_time_picklist__c='6:30 pm';
            shift2.End_time_picklist__c='10:00 pm';
            shift2.Location__StateCode__s = 'ACT';
            shift2.Location__CountryCode__s = 'AU';
            shift2.Location__PostalCode__s = '2911';
            shift.Shift_Type__c='Custom';
            shift1.Split_Shifts__c = false;
            insert shift2;
            
            Add_Shift_Checklist__c  asch2 = new Add_Shift_Checklist__c();
            asch2.Description__c=' teststs ';
            asch2.Mandatory__c = true;
            asch2.Add_Shift__c=shift2.Id;
            insert asch2;
            
            ShiftwithStaff__c staffs1 = new ShiftwithStaff__c();
            staffs1.Add_Shift__c=shift1.Id;
            staffs1.Attendence__c=true;
            staffs1.Comments__c = 'test comments';
            staffs1.Staff__c=staff.Id;
            staffs1.Role__c='Admin';
            staffs1.Status__c='Accepted';
            insert staffs1;
            
            Add_Shift__c shift3 = new Add_Shift__c();
            shift3.Break__c = '30';
            shift3.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift3.Start_Date__c =Date.newInstance(2024, 01, 01);        
            shift3.Role__c='Admin';
            shift3.Get_Facility__c=true;
            shift3.Quantity__c=5;
            shift3.Start_Time__c=Time.newInstance( 18, 30, 00, 00);
            shift3.End_Time__c=Time.newInstance(22, 00, 00, 00);
            shift3.Facility__c=fac.Id;
            shift3.Status__c='Draft';
            shift3.Start_time_picklist__c='6:30 pm';
            shift3.End_time_picklist__c='10:00 pm';
            shift3.Location__StateCode__s = 'ACT';
            shift3.Location__CountryCode__s = 'AU';
            shift3.Location__PostalCode__s = '2911';
            shift3.Shift_Type__c='Night';
            insert shift3;
            
            Add_Shift_Checklist__c  asch3 = new Add_Shift_Checklist__c();
            asch3.Description__c=' teststs ';
            asch3.Mandatory__c = true;
            asch3.Add_Shift__c=shift3.Id;
            insert asch3;
            
              
               Add_Shift__c shift4 = new Add_Shift__c();
            shift4.Break__c = '30';
            shift4.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift4.Start_Date__c =Date.newInstance(2025, 01, 01);        
            shift4.Role__c='Admin';
            shift4.Get_Facility__c=true;
            shift4.Quantity__c=5;
            shift4.Start_Time__c=Time.newInstance( 9, 30, 00, 00);
            shift4.End_Time__c=Time.newInstance(22, 00, 00, 00);
            shift4.Facility__c=fac.Id;
            shift4.Status__c='Draft';
            shift4.Start_time_picklist__c='6:30 pm';
            shift4.End_time_picklist__c='10:00 pm';
            shift4.Location__StateCode__s = 'ACT';
            shift4.Location__CountryCode__s = 'AU';
            shift4.Location__PostalCode__s = '2911';
            shift4.Shift_Type__c='Custom';
            insert shift4;
            
            ShiftwithStaff__c staffs4 = new ShiftwithStaff__c();
            staffs4.Add_Shift__c=shift4.Id;
            staffs4.Attendence__c=true;
            staffs4.Comments__c = 'test comments';
            staffs4.Staff__c=staff.Id;
            staffs4.Role__c='Admin';
            staffs4.Status__c='Accepted';
            staffs4.Long_Morning_Start_Time__c=Time.newInstance(9, 30, 00, 00);
            staffs4.Long_Morning_End_Time__c=Time.newInstance(13, 30, 00, 00);
            staffs.Long_Afternoon_Start_Time__c= Time.newInstance(13, 30, 00, 00);
            staffs.Long_Afternoon_End_Time__c=Time.newInstance(22, 00, 00, 00);
            insert staffs4;
            
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
            
            Funds_Tracker__c funds = new Funds_Tracker__c();
            funds.Registration_Group__c='Assistance Animals';
            funds.Amount_approved__c=11000;
           // funds.Available_Funds__c = 10000;	
            //funds.Spent_Amount__c = 1000;
            funds.Client__c=cli.Id;
            funds.Plan_Type__c ='Plan Managed';
            funds.Approved_Date__c = Date.newInstance(2024, 03, 16);
            insert funds;
            
            Services_and_Support_Plan__c services = new Services_and_Support_Plan__c();
            services.Service_Type__c = NSC.Id;
            services.Service_Users__c=staff.Id;
            services.Funds_Tracker__c=funds.Id;
            services.Service_Type__c = NSC.Id;
            services.Qty__c=5;
           // services.Unit_Price__c = 200;
            services.GST__c='No';
            services.Date_of_Service__c = system.today();//Date.newInstance(2024, 10, 16);
            services.Client__c=cli.Id;
            services.Services__c='Assistance Animals';
            services.State__c='ACT';
            services.Start_Time__c = '3:30 am';
            services.End_Time__c = '5:30 am';
            services.ShiftwithStaff__c=staffs.id;
            insert services;
            
            
            
            Reimbursement__c rei = new Reimbursement__c();
            rei.Mileage__c='30';
            rei.ShiftwithStaff__c=staffs.Id; 
            rei.Approval_Status__c='Approved';
            insert rei;
            
       
            List<Add_Shift_Checklist__c> checklistRecords = new List<Add_Shift_Checklist__c>();
            for (Integer i = 0; i < 2; i++) {
                checklistRecords.add(new Add_Shift_Checklist__c(Completed__c = false,Add_Shift__c = shift1.Id));
            }
            insert checklistRecords;
            
            ShiftWithStaff_Activity__c staffActivity = new ShiftWithStaff_Activity__c();
            staffActivity.ShiftwithStaff__c = staffs1.Id;
            Insert staffActivity;
            
            String jsonData = '{"serviceTypeId":"' +funds.Id + 
                          '","serviceGroupId":"' +NSC.Id + 
                          '","participantId":"' +cli.Id + '"}';
            
             Add_Shift__c shift5 = new Add_Shift__c();
            shift5.Break__c = '30';
            shift5.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift5.Start_Date__c =Date.newInstance(2024, 02, 01);        
            shift5.Role__c='Admin';
            shift5.Get_Facility__c=true;
            shift5.Quantity__c=5;
            shift5.Start_Time__c=Time.newInstance( 18, 30, 00, 00);
            shift5.End_Time__c=Time.newInstance(22, 00, 00, 00);
            shift5.Facility__c=fac.Id;
            shift5.Status__c='Draft';
            shift5.Start_time_picklist__c='6:30 pm';
            shift5.End_time_picklist__c='10:00 pm';
            shift5.Location__StateCode__s = 'ACT';
            shift5.Location__CountryCode__s = 'AU';
            shift5.Location__PostalCode__s = '2911';
            shift5.RefId__c='12535899999';
            shift5.Shift_Type__c='Night';
           	shift5.Service_Details__c=jsonData;
            shift5.Duration__c = 9;
            insert shift5;
            
            ShiftwithStaff__c staffs5 = new ShiftwithStaff__c();
            staffs5.Add_Shift__c=shift5.Id;
            staffs5.Attendence__c=true;
            staffs5.Comments__c = 'test comments';
            staffs5.Staff__c=staff.Id;
            staffs5.Role__c='Admin';
            staffs5.Status__c='Accepted';
            staffs5.Long_Morning_Start_Time__c=Time.newInstance(9, 30, 00, 00);
            staffs5.Long_Morning_End_Time__c=Time.newInstance(13, 30, 00, 00);
            
             
            
            staffs5.Long_Afternoon_Start_Time__c= Time.newInstance(13, 30, 00, 00);
            staffs5.Long_Afternoon_End_Time__c=Time.newInstance(22, 00, 00, 00);
           
            insert staffs5;
            
             Shift_Type__c shiftType = new Shift_Type__c(
            Name = 'Morning',
            Facility__c = fac.Id,
            Start_Time__c = Time.newInstance(9, 0, 0, 0),
            End_Time__c   = Time.newInstance(17, 0, 0, 0),
            Shift_Type__c = 'Morning',
            Colour__c = '#222222'
        );
        insert shiftType;
            
           // Contact staff1 = new Contact(LastName = 'Test Staff');
        //insert staff1;
            
          
        }        
    }    
    
    private static Facility__c getTestFacility() {
        return [
            SELECT Id, Selected_Documents__c
            FROM Facility__c
            LIMIT 1
        ];
    }

    // ---------------------------------------------------------
    // Test: saveDocument + getDocuments
    // ---------------------------------------------------------
    @IsTest
    static void testSaveAndGetDocuments() {
        Facility__c fac = getTestFacility();

        // Build a new document record to be saved via controller
        Facility_Compliance_Setting__c doc = new Facility_Compliance_Setting__c();
        doc.Name = 'Test Facility Doc';
        doc.Document_Name__c = 'NDIS Worker Screening';
        doc.Documents_Category__c = 'Compliance';
        // Facility__c will be set inside the controller

        Test.startTest();
        Facility_Compliance_Setting__c savedDoc =
            FacilityDocumentController.saveDocument(doc, fac.Id);

        // Call getDocuments to ensure it runs without error
        List<Facility_Compliance_Setting__c> docs =
            FacilityDocumentController.getDocuments(fac.Id, 1);
        Test.stopTest();
    }

    // ---------------------------------------------------------
    // Test: deleteDocument
    // ---------------------------------------------------------
   @IsTest
    static void testDeleteDocument() {
        Facility__c fac = getTestFacility();

        Facility_Compliance_Setting__c docToDelete = new Facility_Compliance_Setting__c();
        docToDelete.Name = 'Delete Me';
        docToDelete.Document_Name__c = 'Police Check';
        docToDelete.Documents_Category__c = 'Compliance';
        docToDelete.Facility__c = fac.Id;
        insert docToDelete;

        // Ensure this document is NOT in Selected_Documents__c, so it can be deleted
        fac.Selected_Documents__c = null;
        update fac;

        Test.startTest();
        // Method is void now – just call it, no assignment
        FacilityDocumentController.deleteDocument(docToDelete.Id);
        Test.stopTest();
    }

    @IsTest
    static void testGetFacilityRoles() {
        Facility__c fac = getTestFacility();
    
        // Create at least one active Facility_Role__c
        Facility_Role__c role = new Facility_Role__c();
        role.Role_Name__c = 'Admin';
        role.Facility__c = fac.Id;
        role.Is_Active__c = true;
        insert role;
    
        Test.startTest();
        List<String> roles = FacilityDocumentController.getFacilityRoles(fac.Id);
        Test.stopTest();
    }

    // ---------------------------------------------------------
    // Test: saveTraining
    // ---------------------------------------------------------
    @IsTest
    static void testSaveTraining() {
        Facility__c fac = getTestFacility();

        Facility_Compliance_Setting__c recordData = new Facility_Compliance_Setting__c();
        recordData.Name = 'Training Doc';
        recordData.Document_Name__c = 'Child Protection Training';

        Test.startTest();
        Facility_Compliance_Setting__c saved =
            FacilityDocumentController.saveTraining(recordData, fac.Id);
        Test.stopTest();
    }

    // ---------------------------------------------------------
    // Test: saveIdentity
    // ---------------------------------------------------------
    @IsTest
    static void testSaveIdentity() {
        Facility__c fac = getTestFacility();

        Facility_Compliance_Setting__c recordData = new Facility_Compliance_Setting__c();
        recordData.Name = 'Identity Doc';
        recordData.Document_Name__c = 'Right to Work (Passport/Visa)';

        Test.startTest();
        Facility_Compliance_Setting__c saved =
            FacilityDocumentController.saveIdentity(recordData, fac.Id);
        Test.stopTest();
    }

    // ---------------------------------------------------------
    // Test: saveFacilityComplianceSettings + loadFacilityComplianceSettings
    // ---------------------------------------------------------
    @IsTest
    static void testSaveAndLoadFacilityComplianceSettings() {
        Facility__c fac = getTestFacility();
    
        // Create an existing setting so the "existing" map and update path are covered
        Facility_Compliance_Setting__c existingRec = new Facility_Compliance_Setting__c();
        existingRec.Name = 'Existing Compliance Rule';
        existingRec.Facility__c = fac.Id;
        existingRec.Compliance_Type__c = 'MaxHoursPerWeek';
        existingRec.Is_Active__c = true;
        insert existingRec;
    
        // Incoming settings list
        List<Facility_Compliance_Setting__c> settings = new List<Facility_Compliance_Setting__c>();
    
        // This one should UPDATE the existing record (same Compliance_Type__c)
        Facility_Compliance_Setting__c incoming1 = new Facility_Compliance_Setting__c();
        incoming1.Name = 'Compliance Rule 1 Updated';
        incoming1.Compliance_Type__c = 'MaxHoursPerWeek';
        incoming1.Is_Active__c = true;
        settings.add(incoming1);
    
        // This one should INSERT a new record (different Compliance_Type__c)
        Facility_Compliance_Setting__c incoming2 = new Facility_Compliance_Setting__c();
        incoming2.Name = 'Compliance Rule 2';
        incoming2.Compliance_Type__c = 'MaxHoursPerShift';
        incoming2.Is_Active__c = true;
        settings.add(incoming2);
    
        Test.startTest();
        String result = FacilityDocumentController.saveFacilityComplianceSettings(settings, fac.Id);
    
        // Load them back to execute the query + return path
        List<Facility_Compliance_Setting__c> loaded =
            FacilityDocumentController.loadFacilityComplianceSettings(fac.Id);
        Test.stopTest();
    }

    @IsTest
    static void testGetCategoryForDocument() {
        // Direct call to the public utility method
        String cat1 = FacilityDocumentController.getCategoryForDocument(
            'NDIS Worker Screening',
            'NDIS'
        );
        String cat2 = FacilityDocumentController.getCategoryForDocument(
            'Unknown Doc',
            'NDIS'
        );
    }

    @IsTest
    static void testSyncFacilityDocuments() {
        Facility__c fac = getTestFacility();
    
        // Create an existing DOCUMENT record so existingDocMap loop is covered
        Facility_Compliance_Setting__c existingDoc = new Facility_Compliance_Setting__c();
        existingDoc.Facility__c = fac.Id;
        existingDoc.Compliance_Category__c = 'Documents';
        existingDoc.Document_Name__c = 'NDIS Worker Screening';
        existingDoc.Mandatory_Document__c = false;
        existingDoc.Visible_to_Staff__c = false;
        existingDoc.Expiry_Date_Required__c = false;
        existingDoc.X100_pointcheck__c = '0 Points';
        insert existingDoc;
    
        // Give the facility some selected documents to sync
        // Include the same doc name to hit the "already exists" branch
        fac.Selected_Documents__c = 'NDIS Worker Screening;First Aid';
        update fac;
    
        Test.startTest();
        FacilityDocumentController.syncFacilityDocuments(fac.Id);
    
        // Call getDocuments after sync to execute the SOQL + return
        List<Facility_Compliance_Setting__c> docsAfter =
            FacilityDocumentController.getDocuments(fac.Id, 2);
        Test.stopTest();
    }
    
    @IsTest
    static void testWithStaffRoleMatch() {

        // Fetch existing data from @testSetup
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];

        // Create facility compliance docs
        Facility_Compliance_Setting__c idDoc = new Facility_Compliance_Setting__c(
            Facility__c = fac.Id,
            Document_Name__c = 'Passport',
            Compliance_Category__c = 'Identity',
            Identity_Category__c = 'Primary',
            Identity_Points__c = 70,
            Visible_to_Staff__c = true,
            Roles__c = 'Admin'
        );

        Facility_Compliance_Setting__c otherDoc = new Facility_Compliance_Setting__c(
            Facility__c = fac.Id,
            Document_Name__c = 'Police Check',
            Compliance_Category__c = 'Documents',
            Documents_Category__c = 'Compliance',
            X100_pointcheck__c = '25 Points',
            Visible_to_Staff__c = true,
            Roles__c = 'Admin'
        );

        insert new List<Facility_Compliance_Setting__c>{ idDoc, otherDoc };

        Test.startTest();
        List<Map<String, Object>> result =
            FacilityDocumentController.getFacilityIdentityDocuments(
                new List<String>{ fac.Id },
                staff.Id
            );
        Test.stopTest();
    }

    @IsTest
    static void testRoleMismatch() {

        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];

        Facility_Compliance_Setting__c restrictedDoc = new Facility_Compliance_Setting__c(
            Facility__c = fac.Id,
            Document_Name__c = 'Restricted Doc',
            Compliance_Category__c = 'Identity',
            Identity_Category__c = 'Secondary',
            Visible_to_Staff__c = true,
            Roles__c = 'Support Worker'
        );
        insert restrictedDoc;

        Test.startTest();
        List<Map<String, Object>> result =
            FacilityDocumentController.getFacilityIdentityDocuments(
                new List<String>{ fac.Id },
                staff.Id
            );
        Test.stopTest();

        Boolean found = false;
        for (Map<String, Object> m : result) {
            if (m.get('name') == 'Restricted Doc') {
                found = true;
            }
        }
    }

    @IsTest
    static void testWithoutStaffId() {

        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];

        Facility_Compliance_Setting__c trainingDoc = new Facility_Compliance_Setting__c(
            Facility__c = fac.Id,
            Document_Name__c = 'First Aid',
            Compliance_Category__c = 'Trainings',
            Training_Category__c = 'Safety',
            Visible_to_Staff__c = true
        );
        insert trainingDoc;

        Test.startTest();
        List<Map<String, Object>> result =
            FacilityDocumentController.getFacilityIdentityDocuments(
                new List<String>{ fac.Id },
                null
            );
        Test.stopTest();
    }
}