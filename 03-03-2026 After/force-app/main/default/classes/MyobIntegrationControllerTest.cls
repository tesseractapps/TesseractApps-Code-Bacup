@IsTest
private class MyobIntegrationControllerTest {

    
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
        User user = new User(Alias = 'praveen', Email= 'manualtesting.20294639@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne209463', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', 
                             User_Type__c='NDIS Org Admin', UserName='manualtesting.20294639@hotmail.com',Organization_Name__c ='Ashfield Consultants');
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
            fac.ABN__c='12345678900';
            fac.Phone__c = '12323432';
            fac.Type_of_Service__c='Ndis';
            insert fac;
            
            Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test staff'; 
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtesting.20294639@hotmail.com';
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
            staff.Xero_Employee_ID__c = '123456789';
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
            staffs.Broken_Shift__c = false;
            staffs.Shift_Category__c = 'Standard Hours';
            staffs.Approval_Status__c = 'Approved';
           // staffs.Long_Afternoon_Start_Time__c= Time.newInstance(01, 30, 00, 00);
          //  staffs.Long_Afternoon_End_Time__c=Time.newInstance(01, 30, 00, 00);
          	shift.Start_Time__c=Time.newInstance( 03, 30, 00, 00);
            shift.End_Time__c=Time.newInstance( 05, 00, 00, 00);
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
            staffs1.Broken_Shift__c = false;
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
            staffs4.Long_Afternoon_Start_Time__c= Time.newInstance(13, 30, 00, 00);
            staffs4.Long_Afternoon_End_Time__c=Time.newInstance(22, 00, 00, 00);
            staffs4.Broken_Shift__c = false;
            staffs4.Approval_Status__c = 'Approved';
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
            staffs5.Broken_Shift__c = false;
            staffs5.Approval_Status__c = 'Approved';
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
    
    
    
    
    private class MyobHttpMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            String endpoint = req.getEndpoint();
            String method   = req.getMethod();

            res.setHeader('Content-Type', 'application/json');

            // 1) Auth / Authorize page (HTML with <a href>)
            if (endpoint != null && endpoint.contains('/oauth2/account/authorize')) {
                res.setStatusCode(200);
                res.setHeader('Content-Type', 'text/html');
                res.setBody('<html><body><a href="/oauth2/redirect">Continue</a></body></html>');
            }

            // 2) Exchange code for token
            else if (endpoint != null && endpoint.contains('/oauth2/token')) {
                res.setStatusCode(200);
                res.setBody('{"access_token":"ACCESS_FROM_CODE","refresh_token":"REFRESH_FROM_CODE"}');
            }

            // 3) Refresh token
            else if (endpoint != null && endpoint.contains('/oauth2/v1/authorize')) {
                res.setStatusCode(200);
                res.setBody('{"access_token":"NEW_ACCESS","refresh_token":"NEW_REFRESH"}');
            }

            // 4) Company file root / details
            else if (endpoint != null && endpoint.contains('/accountright/')
                     && !endpoint.contains('/Contact/')
                     && !endpoint.contains('/Payroll/')
                     && !endpoint.contains('/GeneralLedger/')
                     && !endpoint.contains('/Sale/')) {

                // Could be getMyobCompanyFiles or getCompanyFileDetails
                res.setStatusCode(200);
                res.setBody(
                    '[{"Id":"COMPANY-GUID","Name":"Test Company File"}]'
                );
            }

            // 5) Wage categories (for saveMyobWageCategories)
            else if (endpoint != null && endpoint.contains('/Payroll/PayrollCategory/Wage')) {
                res.setStatusCode(200);
                res.setBody(
                    '{"Items":[{"UID":"WAGE1","Name":"Standard Hours"},{"UID":"WAGE2","Name":"Overtime"}]}'
                );
            }

            // 6) Employees list
            else if (endpoint != null && endpoint.contains('/Contact/Employee')
                     && method == 'GET') {
                res.setStatusCode(200);
                res.setBody(
                    '{"Items":[{"UID":"EMP1","FirstName":"Test","LastName":"Employee"}]}'
                );
            }

            // 7) Create employee (POST)
            else if (endpoint != null && endpoint.contains('/Contact/Employee')
                     && method == 'POST') {
                res.setStatusCode(201);
                res.setBody('{"UID":"EMP_CREATED","FirstName":"Created","LastName":"Emp"}');
            }

            // 8) Customers list
            else if (endpoint != null && endpoint.contains('/Contact/Customer')) {
                res.setStatusCode(200);
                res.setBody(
                    '{"Items":[{"UID":"CUST1","CompanyName":"Test Customer"}]}'
                );
            }

            // 9) Suppliers list
            else if (endpoint != null && endpoint.contains('/Contact/Supplier')) {
                res.setStatusCode(200);
                res.setBody(
                    '{"Items":[{"UID":"SUP1","CompanyName":"Test Supplier"}]}'
                );
            }

            // 10) TaxCode lookup
            else if (endpoint != null && endpoint.contains('/GeneralLedger/TaxCode')) {
                res.setStatusCode(200);
                res.setBody(
                    '{"Items":[{"UID":"TAX1","Code":"GST"}]}'
                );
            }

            // 11) Account lookup
            else if (endpoint != null && endpoint.contains('/GeneralLedger/Account')) {
                res.setStatusCode(200);
                res.setBody(
                    '{"Items":[{"UID":"ACC1","Name":"Service Income"}]}'
                );
            }

            // 12) Create / Get Invoice
            else if (endpoint != null && endpoint.contains('/Sale/Invoice/Service')) {
                if (method == 'POST') {
                    // create invoice
                    res.setStatusCode(201);
                    res.setBody('{"UID":"INV1","Number":"INV-0001"}');
                } else {
                    // search/list invoices
                    res.setStatusCode(200);
                    res.setBody('{"Items":[{"UID":"INV1","Number":"INV-0001"}]}');
                }
            }
  // 13) EmployeePayrollDetails - ADD THIS SECTION
            else if (endpoint != null && endpoint.contains('/Contact/EmployeePayrollDetails')) {
                res.setStatusCode(200);
                if (method == 'GET') {
                    res.setBody('{"Items":[{"UID":"EPD1","Employee":{"UID":"EMP123"},"Wage":{"WageCategories":[]}}]}');
                } else if (method == 'PUT') {
                    res.setBody('{"UID":"EPD1","Success":true}');
                }
            }

            // 14) Timesheet endpoint - ADD THIS SECTION
            else if (endpoint != null && endpoint.contains('/Payroll/Timesheet/')) {
                res.setStatusCode(200);
                res.setBody('{"Success":true}');
            }
            // Default fallback
            else {
                res.setStatusCode(200);
                res.setBody('{}');
            }

            return res;
        }
    }

    /**
     * Helper: fetch the Org & User we created in @testSetup.
     */
    private static Organisation__c getTestOrg() {
        return [
            SELECT Id, Name, Client_Id__c, Client_Secret__c
            FROM Organisation__c
            WHERE Name = 'Ashfield Consultants'
            LIMIT 1
        ];
    }

    private static User getTestUser() {
        return [
            SELECT Id, Organization_Name__c
            FROM User
            WHERE Organization_Name__c = 'Ashfield Consultants'
            LIMIT 1
        ];
    }

    // Make sure Org has dummy MYOB app credentials before MYOB calls
    private static void ensureOrgHasClientCredentials() {
        Organisation__c org = getTestOrg();
        if (String.isBlank(org.Client_Id__c) || String.isBlank(org.Client_Secret__c)) {
            org.Client_Id__c     = 'DUMMY_CLIENT_ID';
            org.Client_Secret__c = 'DUMMY_CLIENT_SECRET';
            update org;
        }
    }

    @IsTest
    static void testGetMyobAuthLink() {
        ensureOrgHasClientCredentials();

        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new MyobHttpMock());

            Test.startTest();
            String authUrl = MyobIntegrationController.getMyobAuthLink('https://example.com/callback');
            Test.stopTest();


        }
    }

    @IsTest
    static void testExchangeMyobCodeForToken() {
        ensureOrgHasClientCredentials();

        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new MyobHttpMock());

            Test.startTest();
            String json = MyobIntegrationController.exchangeMyobCodeForToken('dummyCode', 'https://example.com/cb');
            Test.stopTest();

           
        }
    }

    @IsTest
    static void testRefreshMyobToken() {
        ensureOrgHasClientCredentials();

        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new MyobHttpMock());

            Test.startTest();
            String json = MyobIntegrationController.refreshMyobToken('DUMMY_REFRESH');
            Test.stopTest();

        }
    }

    @IsTest
    static void testGetMyobCompanyFiles() {
        ensureOrgHasClientCredentials();

        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new MyobHttpMock());

            Test.startTest();
            String json = MyobIntegrationController.getMyobCompanyFiles('ACCESS', 'REFRESH', 'BUSINESS-ID');
            Test.stopTest();

        
        }
    }

@IsTest
static void testGetCompanyFileDetails_andSaveWageCategories() {
    ensureOrgHasClientCredentials();
    Organisation__c org = getTestOrg();

    User u = getTestUser();
    System.runAs(u) {
        Test.setMock(HttpCalloutMock.class, new MyobHttpMock());

        Test.startTest();
        String details = MyobIntegrationController.getCompanyFileDetails('ACCESS', 'COMPANY-GUID');
        Test.stopTest();
    }

    // Direct coverage of saveMyobWageCategories (no startTest/stopTest here)
    String wageJson = '{"Items":[{"UID":"W1","Name":"Cat1"},{"UID":"W2","Name":"Cat2"}]}';
    MyobIntegrationController.saveMyobWageCategories(wageJson, org.Id);
}

    @IsTest
    static void testGetMyobEmployees_Customers_Suppliers() {
        ensureOrgHasClientCredentials();

        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new MyobHttpMock());

            Test.startTest();
            String employees = MyobIntegrationController.getMyobEmployees('ACCESS', 'REFRESH', 'COMPANY-GUID');
            String customers = MyobIntegrationController.getMyobCustomers('ACCESS', 'REFRESH', 'COMPANY-GUID');
            String suppliers = MyobIntegrationController.getMyobSuppliers('ACCESS', 'REFRESH', 'COMPANY-GUID');
            Test.stopTest();


        }
    }

    @IsTest
    static void testCreateMyobEmployee() {
        ensureOrgHasClientCredentials();

        // Staff__c is created in your @testSetup
        Staff__c staff = [
            SELECT Id
            FROM Staff__c
            LIMIT 1
        ];

        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new MyobHttpMock());

            Test.startTest();
            String resultJson = MyobIntegrationController.createMyobEmployee(
                'ACCESS',
                'REFRESH',
                'https://api.myob.com/accountright/COMPANY-GUID',
                staff.Id
            );
            Test.stopTest();

 
        }
    }

@IsTest
static void testCreateEntityInMyob() {
    ensureOrgHasClientCredentials();

    // Create entity with a VALID ABN and minimal address info
    Xero_Entity__c entity = new Xero_Entity__c(
        First_Name__c               = 'John',
        Email__c                    = 'john@example.com',
        ABN__c                      = '51824753556',   // ✅ valid ABN
        Address_Latest__Street__s   = '8 Keewong Street',
        Address_Latest__City__s     = 'Crace',
        Address_Latest__StateCode__s= 'ACT',
        Address_Latest__PostalCode__s = '2911'
        // 👉 add any other REQUIRED fields in your org here
    );
    insert entity;

    User u = getTestUser();
    System.runAs(u) {
        Test.setMock(HttpCalloutMock.class, new MyobHttpMock());

        Test.startTest();
        String resJson = MyobIntegrationController.createEntityInMYOB(
            entity.Id,
            'https://api.myob.com/accountright/COMPANY-GUID',
            'REFRESH',
            'ACCESS'
        );
        Test.stopTest();


    }
}


@IsTest
static void testCreateMyobInvoice() {
    ensureOrgHasClientCredentials();

    Xero_Entity__c entity = new Xero_Entity__c(
        First_Name__c               = 'John',
        Email__c                    = 'john@example.com',
        ABN__c                      = '51824753556',          // valid ABN
        Xero_Contact_Id__c          = 'CUST1',                // dummy MYOB UID
        Address_Latest__Street__s   = '8 Keewong Street',
        Address_Latest__City__s     = 'Crace',
        Address_Latest__StateCode__s= 'ACT',
        Address_Latest__PostalCode__s = '2911'

    );
    insert entity;

    Xero_or_Myob_Invoice__c inv = new Xero_or_Myob_Invoice__c(
        Status__c       = 'Draft',
        Xero_Entity__c  = entity.Id,
        Invoice_Date__c = Date.today(),
        Total_Amount__c = 100

    );
    insert inv;

    // 3) Create at least one invoice line (child)
    Xero_Invoice_Entries__c entry = new Xero_Invoice_Entries__c(
        Xero_or_Myob_Invoice__c = inv.Id,
        Description__c          = 'Test Line',
        Quantity__c             = 2,
        Unit_Price__c           = 50,
        Total_Amount__c         = 100
    );
    insert entry;

    User u = getTestUser();
    System.runAs(u) {
        Test.setMock(HttpCalloutMock.class, new MyobHttpMock());

        Test.startTest();
        String resJson = MyobIntegrationController.createMyobInvoice(
            inv.Id,
            'ACCESS',
            'REFRESH',
            'https://api.myob.com/accountright/COMPANY-GUID'
        );
        Test.stopTest();

   
    }
}



    @IsTest
    static void testAbnHelpers() {
        // isValidABNForMyob
        Boolean validAbn = MyobIntegrationController.isValidABNForMyob('51824753556'); // example 11-digit ABN
        Boolean invalidAbn = MyobIntegrationController.isValidABNForMyob('123');


        // formatABN
        String formatted = MyobIntegrationController.formatABN('51824753556');

    }
    @IsTest
    static void testInsertMyobTimesheet() {
        ensureOrgHasClientCredentials();
        
    Staff__c staff = [
            SELECT Id
            FROM Staff__c
            LIMIT 1
        ];
    
    ShiftwithStaff__c shift = [
        SELECT Id,
               Staff__c,
               Role__c,
               Status__c,
               Shift_Category__c,
               Date__c,
               Actual_Duration__c,
               Log_In_Date_Time__c,
               Log_Out_Date_Time__c,
               Long_Morning_Start_Time__c,
               Long_Morning_End_Time__c,
               Long_Afternoon_Start_Time__c,
               Long_Afternoon_End_Time__c,
               Add_Shift__c,
               Add_Shift__r.Start_Date__c,
               Add_Shift__r.Start_Time__c,
               Add_Shift__r.End_Time__c,
        	   Broken_Shift__c
        FROM ShiftwithStaff__c
        WHERE Status__c = 'Accepted'
        LIMIT 1
    ];
    
        if (String.isBlank(shift.Shift_Category__c)) {
            shift.Shift_Category__c = 'Standard Hours';
            update shift;
        }
    
        // Payroll items to match Standard Hours to UID
        List<Object> payrollItems = new List<Object>();
        payrollItems.add(new Map<String, Object>{
            'Name' => 'Standard Hours',
            'UID'  => 'WAGE1'
        });
    
        User u = getTestUser();
        System.runAs(u) {
            Test.setMock(HttpCalloutMock.class, new MyobHttpMock());
    
            Test.startTest();
            Map<String, Object> result = MyobIntegrationController.insertMyobTimesheet(
                'https://api.myob.com/accountright/COMPANY-GUID',
                'ACCESS',
                'EMP123',
                Date.newInstance(2025, 01, 01),
                Date.newInstance(2025, 01, 31),
                new List<ShiftwithStaff__c>{ shift },
                payrollItems
            );
            Test.stopTest();
        }
    }
@IsTest
static void testTimesheet_NoWageCategory() {
    ensureOrgHasClientCredentials();

    ShiftwithStaff__c shift = [
        SELECT Id, Staff__c, Add_Shift__c, Shift_Category__c
        FROM ShiftwithStaff__c
        WHERE Status__c = 'Accepted'
        LIMIT 1
    ];

    // Payroll list that does NOT match any category
    List<Object> payrollItems = new List<Object>();

    User u = getTestUser();
    System.runAs(u) {
        Test.setMock(HttpCalloutMock.class, new MyobHttpMock());

        Test.startTest();
        try {
            MyobIntegrationController.insertMyobTimesheet(
                'https://api.myob.com/accountright/COMPANY-GUID',
                'ACCESS', 'EMP123',
                Date.newInstance(2024, 02, 01),
                Date.newInstance(2024, 02, 07),
                new List<ShiftwithStaff__c>{ shift },
                payrollItems
            );
        } catch (Exception e) {
            // Expected, do nothing
        }
        Test.stopTest();
    }
}
 @IsTest
static void testPutEmployeePayrollDetails_Success() {
    ensureOrgHasClientCredentials();
    
    Staff__c staff = [SELECT Id,Xero_Employee_ID__c FROM Staff__c LIMIT 1];
    staff.Xero_Employee_ID__c = 'EMP123';
    update staff;
    
    String epdUid = 'EPD123';
    
    Map<String, Object> epdBody = new Map<String, Object>{
        'Employee' => new Map<String, Object>{
            'UID' => staff.Xero_Employee_ID__c
        },
        'Wage' => new Map<String, Object>{
            'WageCategories' => new List<Map<String, Object>>{
                new Map<String, Object>{
                    'PayrollCategory' => new Map<String, Object>{
                        'UID' => 'WAGE1',
                        'Name' => 'Standard Hours'
                    },
                    'DefaultHourlyRate' => 50.00,
                    'IsExemptFromSuperannuationGuarantee' => false
                }
            }
        },
        'SuperannuationFund' => new Map<String, Object>{
            'UID' => 'SUPER1',
            'Name' => 'Default Super Fund'
        },
        'PaymentSummary' => new Map<String, Object>{
            'EmploymentBasis' => 'Full-Time',
            'Occupation' => 'Support Worker'
        }
    };
    
    User u = getTestUser();
    System.runAs(u) {
        Test.setMock(HttpCalloutMock.class, new MyobHttpMock());
        
        Test.startTest();
        MyobIntegrationController.putEmployeePayrollDetails(
            'https://api.myob.com/accountright/COMPANY-GUID',
            'ACCESS_TOKEN',
            epdUid,
            epdBody
        );
        Test.stopTest();
    }
}
    @IsTest
static void testPutEmployeePayrollDetails_ErrorResponse() {
    ensureOrgHasClientCredentials();
    
    String epdUid = 'EPD123';
    
    Map<String, Object> epdBody = new Map<String, Object>{
        'Employee' => new Map<String, Object>{
            'UID' => 'EMP123'
        }
    };
    
    User u = getTestUser();
    System.runAs(u) {
        // Create a custom mock that returns an error response
        Test.setMock(HttpCalloutMock.class, new MyobHttpMockErrorResponse());
        
        Test.startTest();
        try {
            MyobIntegrationController.putEmployeePayrollDetails(
                'https://api.myob.com/accountright/COMPANY-GUID',
                'ACCESS_TOKEN',
                epdUid,
                epdBody
            );
        } catch (AuraHandledException e) {
            // Expected
        }
        Test.stopTest();
    }
}

// Add this inner class to handle the error response
private class MyobHttpMockErrorResponse implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setStatusCode(400);
        res.setHeader('Content-Type', 'application/json');
        res.setBody('{' +
            '"Errors": [' +
            '  {' +
            '    "Name": "ValidationError",' +
            '    "Message": "Invalid employee UID",' +
            '    "AdditionalDetails": "The specified employee does not exist"' +
            '  },' +
            '  {' +
            '    "Name": "FieldError",' +
            '    "Message": "Wage category is required",' +
            '    "AdditionalDetails": null' +
            '  }' +
            ']' +
        '}');
        return res;
    }
}
    //manendra
@IsTest
static void testPutEmployeePayrollDetails_NetworkError() {
    ensureOrgHasClientCredentials();
    
    String epdUid = 'EPD123';
    
    Map<String, Object> epdBody = new Map<String, Object>{
        'Employee' => new Map<String, Object>{
            'UID' => 'EMP123'
        }
    };
    
    User u = getTestUser();
    System.runAs(u) {
        Test.setMock(HttpCalloutMock.class, new MyobHttpMockNetworkError());
        
        Test.startTest();
        try {
            MyobIntegrationController.putEmployeePayrollDetails(
                'https://api.myob.com/accountright/COMPANY-GUID',
                'ACCESS_TOKEN',
                epdUid,
                epdBody
            );
            // If we reach here, the method should have handled the exception
            // This is actually testing that the method doesn't crash
        } catch (Exception e) {
            // Any exception is acceptable - could be AuraHandledException or CalloutException
            System.debug('Caught expected exception: ' + e.getMessage());
        }
        Test.stopTest();
    }
}

@IsTest
static void testPutEmployeePayrollDetails_InvalidJSONResponse() {
    ensureOrgHasClientCredentials();
    
    String epdUid = 'EPD123';
    
    Map<String, Object> epdBody = new Map<String, Object>{
        'Employee' => new Map<String, Object>{
            'UID' => 'EMP123'
        }
    };
    
    User u = getTestUser();
    System.runAs(u) {
        Test.setMock(HttpCalloutMock.class, new MyobHttpMockInvalidJSON());
        
        Test.startTest();
        try {
            MyobIntegrationController.putEmployeePayrollDetails(
                'https://api.myob.com/accountright/COMPANY-GUID',
                'ACCESS_TOKEN',
                epdUid,
                epdBody
            );
        } catch (AuraHandledException e) {
            // Expected
        }
        Test.stopTest();
    }
}

@IsTest
static void testPutEmployeePayrollDetails_Success201() {
    ensureOrgHasClientCredentials();
    
    String epdUid = 'EPD123';
    
    Map<String, Object> epdBody = new Map<String, Object>{
        'Employee' => new Map<String, Object>{
            'UID' => 'EMP123'
        }
    };
    
    User u = getTestUser();
    System.runAs(u) {
        Test.setMock(HttpCalloutMock.class, new MyobHttpMockSuccess201(epdUid));
        
        Test.startTest();
        MyobIntegrationController.putEmployeePayrollDetails(
            'https://api.myob.com/accountright/COMPANY-GUID',
            'ACCESS_TOKEN',
            epdUid,
            epdBody
        );
        Test.stopTest();
    }
}

@IsTest
static void testPutEmployeePayrollDetails_EmptyResponseBody() {
    ensureOrgHasClientCredentials();
    
    String epdUid = 'EPD123';
    
    Map<String, Object> epdBody = new Map<String, Object>{
        'Employee' => new Map<String, Object>{
            'UID' => 'EMP123'
        }
    };
    
    User u = getTestUser();
    System.runAs(u) {
        Test.setMock(HttpCalloutMock.class, new MyobHttpMockEmptyResponse());
        
        Test.startTest();
        try {
            MyobIntegrationController.putEmployeePayrollDetails(
                'https://api.myob.com/accountright/COMPANY-GUID',
                'ACCESS_TOKEN',
                epdUid,
                epdBody
            );
        } catch (AuraHandledException e) {
            // Expected
        }
        Test.stopTest();
    }
}

@IsTest
static void testPutEmployeePayrollDetails_MissingRequiredHeaders() {
    ensureOrgHasClientCredentials();
    
    String epdUid = 'EPD123';
    
    Map<String, Object> epdBody = new Map<String, Object>{
        'Employee' => new Map<String, Object>{
            'UID' => 'EMP123'
        }
    };
    
    User u = getTestUser();
    Organisation__c org = getTestOrg();
    
    System.runAs(u) {
        MyobHttpMockCaptureHeaders mock = new MyobHttpMockCaptureHeaders();
        Test.setMock(HttpCalloutMock.class, mock);
        
        Test.startTest();
        MyobIntegrationController.putEmployeePayrollDetails(
            'https://api.myob.com/accountright/COMPANY-GUID',
            'ACCESS_TOKEN',
            epdUid,
            epdBody
        );
        Test.stopTest();
    }
}

// Add tests for refreshMyobToken with error
@IsTest
static void testRefreshMyobToken_Error() {
    ensureOrgHasClientCredentials();
    
    User u = getTestUser();
    System.runAs(u) {
        Test.setMock(HttpCalloutMock.class, new MyobHttpMockTokenError());
        
        Test.startTest();
        String result = MyobIntegrationController.refreshMyobToken('INVALID_REFRESH');
        Test.stopTest();
    }
}

// Add test for getMyobCompanyFiles with error
@IsTest
static void testGetMyobCompanyFiles_Error() {
    ensureOrgHasClientCredentials();
    
    User u = getTestUser();
    System.runAs(u) {
        Test.setMock(HttpCalloutMock.class, new MyobHttpMockCompanyFilesError());
        
        Test.startTest();
        String result = MyobIntegrationController.getMyobCompanyFiles('INVALID_TOKEN', 'REFRESH', 'BUSINESS-ID');
        Test.stopTest();
    }
}

// Add test for createMyobEmployee with error
@IsTest
static void testCreateMyobEmployee_Error() {
    ensureOrgHasClientCredentials();
    
    Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
    
    User u = getTestUser();
    System.runAs(u) {
        Test.setMock(HttpCalloutMock.class, new MyobHttpMockCreateEmployeeError());
        
        Test.startTest();
        try {
            String resultJson = MyobIntegrationController.createMyobEmployee(
                'INVALID_TOKEN',
                'REFRESH',
                'https://api.myob.com/accountright/COMPANY-GUID',
                staff.Id
            );
        } catch (Exception e) {
            // Expected
        }
        Test.stopTest();
    }
}

// Add test for createEntityInMYOB with error
@IsTest
static void testCreateEntityInMyob_Error() {
    ensureOrgHasClientCredentials();
    
    Xero_Entity__c entity = new Xero_Entity__c(
        First_Name__c               = 'John',
        Email__c                    = 'john@example.com',
        ABN__c                      = '51824753556',
        Address_Latest__Street__s   = '8 Keewong Street',
        Address_Latest__City__s     = 'Crace',
        Address_Latest__StateCode__s= 'ACT',
        Address_Latest__PostalCode__s = '2911'
    );
    insert entity;
    
    User u = getTestUser();
    System.runAs(u) {
        Test.setMock(HttpCalloutMock.class, new MyobHttpMockCreateEntityError());
        
        Test.startTest();
        try {
            String resJson = MyobIntegrationController.createEntityInMYOB(
                entity.Id,
                'https://api.myob.com/accountright/COMPANY-GUID',
                'REFRESH',
                'INVALID_TOKEN'
            );
        } catch (Exception e) {
            // Expected
        }
        Test.stopTest();
    }
}

// Add test for createMyobInvoice with error
@IsTest
static void testCreateMyobInvoice_Error() {
    ensureOrgHasClientCredentials();
    
    Xero_Entity__c entity = new Xero_Entity__c(
        First_Name__c               = 'John',
        Email__c                    = 'john@example.com',
        ABN__c                      = '51824753556',
        Xero_Contact_Id__c          = 'CUST1',
        Address_Latest__Street__s   = '8 Keewong Street',
        Address_Latest__City__s     = 'Crace',
        Address_Latest__StateCode__s= 'ACT',
        Address_Latest__PostalCode__s = '2911'
    );
    insert entity;
    
    Xero_or_Myob_Invoice__c inv = new Xero_or_Myob_Invoice__c(
        Status__c       = 'Draft',
        Xero_Entity__c  = entity.Id,
        Invoice_Date__c = Date.today(),
        Total_Amount__c = 100
    );
    insert inv;
    
    Xero_Invoice_Entries__c entry = new Xero_Invoice_Entries__c(
        Xero_or_Myob_Invoice__c = inv.Id,
        Description__c          = 'Test Line',
        Quantity__c             = 2,
        Unit_Price__c           = 50,
        Total_Amount__c         = 100
    );
    insert entry;
    
    User u = getTestUser();
    System.runAs(u) {
        Test.setMock(HttpCalloutMock.class, new MyobHttpMockCreateInvoiceError());
        
        Test.startTest();
        try {
            String resJson = MyobIntegrationController.createMyobInvoice(
                inv.Id,
                'INVALID_TOKEN',
                'REFRESH',
                'https://api.myob.com/accountright/COMPANY-GUID'
            );
        } catch (Exception e) {
            // Expected
        }
        Test.stopTest();
    }
}

// Now add the required inner classes at the end of your test class (before the final closing brace)

private class MyobHttpMockNetworkError implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        CalloutException e = new CalloutException();
        e.setMessage('Unable to complete callout: Network error');
        throw e;
    }
}

private class MyobHttpMockInvalidJSON implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setStatusCode(500);
        res.setHeader('Content-Type', 'application/json');
        res.setBody('<html>Server Error</html>');
        return res;
    }
}

private class MyobHttpMockSuccess201 implements HttpCalloutMock {
    private String epdUid;
    
    public MyobHttpMockSuccess201(String uid) {
        this.epdUid = uid;
    }
    
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setStatusCode(201);
        res.setHeader('Content-Type', 'application/json');
        res.setBody('{' +
            '"UID": "' + epdUid + '",' +
            '"Employee": {' +
            '  "UID": "EMP123"' +
            '},' +
            '"Success": true' +
        '}');
        return res;
    }
}

private class MyobHttpMockEmptyResponse implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setStatusCode(204);
        res.setHeader('Content-Type', 'application/json');
        res.setBody('');
        return res;
    }
}

private class MyobHttpMockCaptureHeaders implements HttpCalloutMock {
    public Map<String, String> capturedHeaders = new Map<String, String>();
    
    public HTTPResponse respond(HTTPRequest req) {
        capturedHeaders.put('Authorization', req.getHeader('Authorization'));
        capturedHeaders.put('x-myobapi-key', req.getHeader('x-myobapi-key'));
        capturedHeaders.put('x-myobapi-version', req.getHeader('x-myobapi-version'));
        capturedHeaders.put('x-myobapi-cftoken', req.getHeader('x-myobapi-cftoken'));
        capturedHeaders.put('Content-Type', req.getHeader('Content-Type'));
        capturedHeaders.put('Accept', req.getHeader('Accept'));
        
        HttpResponse res = new HttpResponse();
        res.setStatusCode(200);
        res.setBody('{"Success": true}');
        return res;
    }
}

private class MyobHttpMockTokenError implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setStatusCode(400);
        res.setHeader('Content-Type', 'application/json');
        res.setBody('{"error":"invalid_grant","error_description":"Invalid refresh token"}');
        return res;
    }
}

private class MyobHttpMockCompanyFilesError implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setStatusCode(401);
        res.setHeader('Content-Type', 'application/json');
        res.setBody('{"Errors":[{"Name":"AuthenticationError","Message":"Invalid access token"}]}');
        return res;
    }
}

private class MyobHttpMockCreateEmployeeError implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setStatusCode(400);
        res.setHeader('Content-Type', 'application/json');
        res.setBody('{"Errors":[{"Name":"ValidationError","Message":"Required fields missing"}]}');
        return res;
    }
}

private class MyobHttpMockCreateEntityError implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setStatusCode(400);
        res.setHeader('Content-Type', 'application/json');
        res.setBody('{"Errors":[{"Name":"ValidationError","Message":"Invalid ABN format"}]}');
        return res;
    }
}

private class MyobHttpMockCreateInvoiceError implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setStatusCode(400);
        res.setHeader('Content-Type', 'application/json');
        res.setBody('{"Errors":[{"Name":"ValidationError","Message":"Customer does not exist"}]}');
        return res;
    }
}
    
      @IsTest
    static void testGetClientId_Success() {
        // Setup - ensure org has client ID
        Organisation__c org = getTestOrg();
        org.Client_Id__c = 'TEST_CLIENT_ID_123';
        update org;
        
        User testUser = getTestUser();
        
        Test.startTest();
        System.runAs(testUser) {
            String clientId = MyobIntegrationController.getClientId();
        }
        Test.stopTest();
    }
    
    @IsTest
    static void testGetClientId_NoOrganizationName() {
        // Create a user without Organization_Name__c
        Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Standard User%' LIMIT 1];
        User userWithoutOrg = new User(
            Alias = 'testusr',
            Email = 'manualtesting.20294649@hotmail.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'TestUser',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = prof.Id,
            TimeZoneSidKey = 'America/New_York',
            UserName = 'manualtesting.20294649@hotmail.com'
            // Note: Organization_Name__c is not set
        );
        insert userWithoutOrg;
        
        Test.startTest();
        System.runAs(userWithoutOrg) {
            try {
                String clientId = MyobIntegrationController.getClientId();
            } catch (AuraHandledException e) {
            }
        }
        Test.stopTest();
    }
    
    @IsTest
    static void testGetClientId_NoClientIdInOrg() {
        // Setup - remove client ID from org
        Organisation__c org = getTestOrg();
        org.Client_Id__c = null;
        update org;
        
        User testUser = getTestUser();
        
        Test.startTest();
        System.runAs(testUser) {
            try {
                String clientId = MyobIntegrationController.getClientId();
               
            } catch (AuraHandledException e) {

            }
        }
        Test.stopTest();
    }
    
    @IsTest
    static void testMatchFound() {
        
        // Create mock wage category list
        List<Object> items = new List<Object>();
        
        Map<String, Object> cat1 = new Map<String, Object>{
            'Name' => 'Morning Shift',
            'UID'  => 'UID-001'
        };
        
        Map<String, Object> cat2 = new Map<String, Object>{
            'Name' => 'Evening Shift',
            'UID'  => 'UID-002'
        };
        
        items.add(cat1);
        items.add(cat2);
        
        Test.startTest();
        String result = MyobIntegrationController.getWageCategoryName('Morning', items);
        Test.stopTest();
        
        System.assertEquals('Morning Shift', result);
    }
}