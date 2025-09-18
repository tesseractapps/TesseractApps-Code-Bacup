@isTest
private class ServiceSupportPlanHandlerTest {    
    @testsetup Static void testData(){         
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
            fac.ABN__c='1235645433';
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
            
            Staff__c staff1 = new Staff__c();
            staff1.Last_Name__c='Test staff1';
            staff1.Name='praveen1';
            staff1.Name__c='abcdr';
            staff1.Contact_Number__c='56789908743';
            staff1.Email_Address__c= 'manualtesting.4139561@hotmail.com';
            staff1.Facility__c=fac.Id;
            staff1.Address__Street__s='8 Keewong Street';
            staff1.Address__City__s = 'Crace';
            staff1.Address__StateCode__s='ACT';
            staff1.Address__PostalCode__s='2911';
            staff1.Emergency_Phone_Number__c='45678766675';
            staff1.Primary_Contact_Name__c='Praveen';
            staff1.Primary_Contact_Number__c='9908458298';
            staff1.Make_Primary_as_Approver__c=true;
            staff1.Primary_Contact_Email__c='praveenshesham.sp@gmail.com';
            staff1.Secondary_Contact_Name__c='maheswari';
            staff1.Secondary_Contact_Email__c='maheswari.adabala@gmail.com';
            staff1.Make_Secondary_as_Approver__c=false;
            staff1.Secondary_Contact_Number__c='990845829528';
            staff1.Emp_exit_date__c = date.newInstance(2027, 01, 05);
            staff1.Emp_Start_Date__c = date.newInstance(2026, 02, 01);
            staff1.Payee_ETP_Payment_Date__c = date.newInstance(2025, 02, 04);
            staff1.Date_Of_Birth__c = date.newInstance(2001, 02, 04);
            staff1.role__c='Admin';
            staff1.Residency_Type__c = 'Australian';
            staff1.Expiry_Date__c = date.newInstance(2025,02, 19);
            staff1.Type__c = 'Visa Status';
            staff1.Working_Hours_Rate__c=50;
            staff1.Annual_Leave__c=10;
            staff1.Sick_Leave__c=2;
            staff1.Bereavement_Leave__c=10;
            staff1.Parental_Leave__c=3;
            insert staff1; 
            
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
            insert shift; 
            
            Add_Shift__c shift1 = new Add_Shift__c();
            shift1.Break__c = '30';
            shift1.Do_you_want_to_set_this_a_recurring_shif__c=true;
            shift1.Start_Date__c =Date.newInstance(2024, 10, 16);        
            shift1.Direction__c=dire.Id;
            shift1.Role__c='Admin';
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
            
            ShiftwithStaff__c staffs1 = new ShiftwithStaff__c();
            staffs1.Add_Shift__c=shift1.Id;
            staffs1.Attendence__c=true;
            staffs1.Comments__c = 'test comments';
            staffs1.Staff__c=staff.Id;
            staffs1.Role__c='Admin';
            staffs1.Status__c='Accepted';
            staffs1.Log_In_Date_Time__c = Time.newInstance( 3, 30, 00, 00);
            staffs1.Log_Out_Date_Time__c = Time.newInstance( 5, 00, 00, 00);
           // staffs.End_Time__c=system.now();
            insert staffs1;             
            
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
            services.ShiftwithStaff__c=staffs1.id;
            insert services;
            
            Client_Journel__c journel=new Client_Journel__c();
            journel.Client__c=cli.Id;
            journel.Notes_Type__c = 'Care Notes	';
            journel.Description__c = 'Test Care Notes Description';
            insert journel;
            
            Leave__c leave = new leave__c();
            leave.Approved_by__c = 'Maheswari';
            leave.Comments__c = 'Test Comments';
            leave.Duration__c = 40;
            leave.Staff__c = staff.Id;
            leave.Type_of_Leave__c = 'Annual Leave';
            leave.Status__c = 'Requested';
            leave.From__c=Date.newInstance(2024, 03, 16);
            leave.To__c=Date.newInstance(2024, 03, 17);
            insert leave;
            
            Leave__c leave1 = new Leave__c(
            Staff__c = staff.Id,
            Status__c = 'Requested',
            Type_of_Leave__c = 'Sick leave',
            From__c=Date.newInstance(2024, 03, 18),
            To__c=Date.newInstance(2024, 03, 19),
            Duration__c = 3);
            insert leave1;
        
            
           Leave__c leave2 = new Leave__c(
            Staff__c = staff.Id,
            Status__c = 'Requested',
            Type_of_Leave__c = 'Parental Leave',
            From__c=Date.newInstance(2025, 03, 20),
            To__c=Date.newInstance(2025, 03, 21),
            Duration__c = 4 );
            
            Leave__c leave3 = new Leave__c(
            Staff__c = staff.Id,
            Status__c = 'Requested',
            Type_of_Leave__c = 'Other Leave',
            From__c=Date.newInstance(2025, 03, 22),
            To__c=Date.newInstance(2025, 03, 23),
            Duration__c = 4 );
            
        	insert new List<Leave__c> { leave2,leave3}; 
                
            BAS_and_IAS__c bas = new BAS_and_IAS__c();
            bas.Form_Type__c = 'A.BAS';
            insert bas;
            
            Company__c comp = new Company__c();
            comp.ABN__c = fac.ABN__c;
            comp.Email__c = fac.Email__c;
            insert comp;
            
            comp.ABN__c = '99999999999';
        	update comp;
            
            Public_Holiday__c pb= new Public_Holiday__c();
            pb.Date__c=Date.newInstance(2025, 03, 22);
            pb.Holiday_Name__c='Anzac day';
            pb.Organization__c=org.Id;
            pb.State__c='New South Wales';
            insert pb;
            
            String Year = '2023';
            String Month = '4';
            String Day = '5';
            String startDate = Year + '-' + Month + '-' + Day;  
            
            String Year1 = '2023';
            String Month1 = '4';
            String Day1 = '5';
            String endDate = Year1 + '-' + Month1 + '-' + Day1;  
            
            string journel1 =NULL;
            List<Facility__c> facilityList = [SELECT Id FROM Facility__c];
            test.startTest();
            ParticipantDetailsHandler.listOfClientjounel(cli.Id);
            ParticipantDetailsHandler.saveDesc(cli.Id, journel.Id, journel.Description__c, journel.Notes_Type__c);
            ParticipantDetailsHandler.saveDesc(cli.Id, journel1,journel.Description__c, journel.Notes_Type__c);
            LeaveController.getLeaves(leave.Id,org.Id);
            LeaveController.getLeavesByOrg(org.Id,Date.newInstance(2024, 03, 20),Date.newInstance(2024, 03, 23));
            LeaveController.getHolidayCount(Date.newInstance(2024, 03, 20),Date.newInstance(2024, 03, 23), 'Australian Capital Territory');
            LeaveController.getHolidayList('Australian Capital Territory', '01-07-2024');
            LeaveController.holidayListbyOrg(startDate,'ACT');
            ActivityStatementHandler.getActivityStatement(bas.Id);
            ActivityStatementHandler.getStatementData('A.BAS',startDate,endDate);
            ActivityStatementHandler.fetchStaffByOrgId();
            UserController.getCurrentUserName();
         /*   List<ShiftwithStaff__c> results = ShiftReportsController.getShiftWithStaffData(
                'All',             // role
                'All',             // employment type
                String.valueOf(Date.today()),
                String.valueOf(Date.today().addDays(7)),
                'Participant',
                new List<Id>{facilityList[0].Id}
            );
            Map<String, Object> result = ShiftReportsController.getAddShiftById(staffs1.Id);
            //ApexPages.currentPage().getParameters().put('shiftId', shift.Id);

        	//ShiftReportsDownloadController controller = new ShiftReportsDownloadController();
        	ApexPages.currentPage().getParameters().put('shiftId', staffs1.Id);

            ShiftReportsDownloadController controller = new ShiftReportsDownloadController();*/
    
            // Assert populated values
           /* System.assertEquals('Nick Test', controller.staffName);
            System.assertEquals('Signed digitally', controller.signature);
            System.assert(controller.activityLogs.size() > 0, 'Should have activity logs');
            System.assert(controller.services.size() > 0, 'Should have services');
            System.assert(controller.shiftNotes.size() > 0, 'Should have shift notes');
            System.assert(controller.checklist.size() > 0, 'Should have checklist items');
            System.assertEquals(25, controller.reimbursement);*/
           
            
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            
            req.requestURI = '/services/apexrest/holidayListApi/';
            req.httpMethod = 'GET';
            req.params.put('year', '2025');
            
            RestContext.request = req;
            RestContext.response = res;
            MobileStaffAvailabilityHoliday.getHolidayListData();
            test.stopTest();
        }
    }
    
    @isTest
    public static void TestfetchFiles(){
         User u1= [SELECT Id from User where email='manualtesting.4139562@hotmail.com' LIMIT 1];
         System.runAs(u1){ 
        Client__c cli = [select Id from Client__c where Last_Name__c='Participant2948' limit 1];
        string recordId = cli.Id;
        Client_Journel__c journel = [Select Id,Notes_Type__c,Description__c FROM Client_Journel__c LIMIT 1];
        Organisation__c org = [SELECT Id,Name from Organisation__c where name='Ashfield Consultants' limit 1];
        String orgId = org.Id;
        Funds_Tracker__c fund = [SELECT ID from Funds_Tracker__c  where Registration_Group__c='Assistance Animals' limit 1];
        String fundId = fund.Id;
        Staff__c stff = [SELECT ID from Staff__c where Email_Address__c='manualtesting.4139562@hotmail.com' ];
        String staffId = stff.ID;
       /* ShiftwithStaff__c shifts = [ SELECT Id, Log_In_Date_Time__c, Log_Out_Date_Time__c FROM ShiftwithStaff__c ];
        String shiftId  = shifts.ID; */
        NDIS_Support_Catalogue__c ndisValue=[select id from NDIS_Support_Catalogue__c limit 1];
          list<ID> ndisIdList= new list<Id>();
           string ndisId=ndisValue.id;
               ndisIdList.add(ndisId);
             Facility__c fac= [select id,Organisation__c, ABN__c,Email__c from Facility__c where name='Ashfield Consultants' ];
             string facId=fac.id;
        String Year = '2023';
        String Month = '4';
        String Day = '5';
        String stringtype = Year + '-' + Month + '-' + Day;  
        String startDate = Year + '-' + Month + '-' + Day;
        
        String Year1 = '2023';
        String Month1 = '4';
        String Day1 = '5';
        String stringtype1 = Year1 + '-' + Month1 + '-' + Day1;  
        String endDate = Year1 + '-' + Month1 + '-' + Day1;  
        New_Support_Plan__c plan= [select id,Client__c from New_Support_Plan__c where Client__c=:recordId LIMIT 1];
        ShiftwithStaff__c shiftId = [SELECT ID From ShiftwithStaff__c LIMIT 1];
        Company__c comp= [SElECT ID,ABN__c,Email__c  from Company__c LIMIT 1];
        String compId = comp.Id;
        
        Decimal amount = 100;
		Map<Id, Id> catalogToJunctionMap = new Map<Id, Id>();
             
        test.startTest();
        
        ServiceSupportPlanHandler.fetchFiles(recordId);
        ServiceSupportPlanHandler.serviceSupportList(recordId,startDate,endDate);
        ServiceSupportPlanHandler.getClientFunds (recordId, 'General');
        ServiceSupportPlanHandler.getNDISServiceItemNames('Test Service Name');
       // ServiceSupportPlanHandler.InsertServiceInvoice('Test User', recordId, cli.Id,'Test Description','1000');
        ServiceSupportPlanHandler.getInvoices(recordId);
        ServiceSupportPlanHandler.fetchSupId(recordId);
        ServiceSupportPlanHandler.fetchSupId(cli.Id);        
        ServiceSupportPlanHandler.getResourceName('test');
        ServiceSupportPlanHandler.getInvoiceListInPayroll(orgId,stringtype,stringtype1);
        ServiceSupportPlanHandler.getServicesAndSupportPlans(cli.Id);     
        ServiceSupportPlanHandler.getServicesByShift(shiftId.ID);
        //ServiceSupportPlanHandler.getServicesByShift(shiftId);
        List<NDIS_Support_Catalogue__c> NDIS = ServiceSupportPlanHandler.getNDISServiceLineItem('Test Service',stringtype1);
        list<Services_and_Support_Plan__c> services = ServiceSupportPlanHandler.getServicesByDate(cli.Id, stringtype1) ; 
        list<Services_and_Support_Plan__c> services12=  ServiceSupportPlanHandler.getServicesAndSupportPlansByDate(cli.Id, '2025-05-09') ;
         ServiceSupportPlanHandler.insertClientFundTrackerLinks(fundId, cli.Id, ndisIdList,'ACT__c',amount,catalogToJunctionMap, ndisValue.Id);
             ClientFundTransferHandler.fetchfundTracker(cli.Id);
             ClientFundTransferHandler.fundTrackerRecord(cli.Id);
        list<Services_and_Support_Plan__c> sspList=[Select id,Services__c,Funds_Tracker__c,Amount__c,Services_name__c,Status__c,Start_Date__c,End_Date__c,Date_of_Service__c,Client__c,Service_Type__c,Qty__c,ShiftwithStaff__c from Services_and_Support_Plan__c ];
        list<string>selectedIds=new list<string>();
        for(Services_and_Support_Plan__c ss:sspList){
            selectedIds.add(ss.Id);
        }
        
        string strStartDate = string.valueof(sspList[0].Start_Date__c);
        string strEndDate = string.valueof(sspList[0].End_Date__c);
        
        ServiceSupportPlanHandler.getSupportData(selectedIds);
        ServiceSupportPlanHandler.UpdateServiceStatus(selectedIds);
        ServiceandSupportController.updateAvailableFundsOnDelete(sspList);
       
        string startDateValue='2024-03-16';
        List<Staff__c> staffList = [SELECT Id from Staff__c];
         List<Id> updatedStaffIds = new List<Id>{ staffList[0].Id, staffList[1].Id };
       
           
        	//string result=ServiceSupportPlanHandler.createSupportRecord('Assistance Animals', 'Not Yet Invoiced','ACT', '3:30 am', '5:30 am', startDateValue, recordId, fundId, staffId,ndisId, '2', shiftId);
            ClientDataController.fetchFacilitiess(orgId,'Test','Participant2948');
            ClientDataController.getClientById(cli.Id);
            FacilityController.fetchFacilitiesByOrgId(orgId);
            FacilityController.fetchFacilitiesByOrgId('');
            FacilityController.fetchFacilitiesByOrgIdCommunity(fac.Organisation__c,'Ashfield Consultants');
            FacilityController.statusFacility(facId, 'false');
            FacilityController.getfacilityById(facId);
            ClientDataController.getClientByEmail('manualtesting.4139562@hotmail.com');
            ClientDataController.getStaffData(cli.Id,stringtype1,'Admin');
            ClientDataController.insertStaffRecords(cli.Id,'AIN', updatedStaffIds);
          //  ClientDataController.updateStaffAssignments(cli.Id, updatedStaffIds); //,'AIN'
            ClientDataController.getParticipantJournal(cli.Id);
            ClientDataController.getParticipantdetails(cli.Id);
           // ClientDataController.saveStatusData(TRUE, TRUE, cli.Id, 'Test Medications', 'Test Allergies', 'Test Notes', Date.newInstance(2024, 5, 16));

            ParticipantDetailsHandler.listOfClientjounel(cli.Id);
            ParticipantDetailsHandler.saveDesc(cli.Id, journel.Id, journel.Description__c, journel.Notes_Type__c);
             string journel1 =NULL;
            ParticipantDetailsHandler.saveDesc(cli.Id, journel1,journel.Description__c, journel.Notes_Type__c);
             ParticipantDetailsHandler.communityPage();
        	//FacilityController.fetchFacility(facId);
        }
       
        test.StopTest();
    }
   
    
    @isTest static void testSaveStatusData() {
        User u1= [SELECT Id from User where email='manualtesting.4139562@hotmail.com' LIMIT 1];
        Risk_Management__c risk = [SELECT ID,Risk_Index__c FROM Risk_Management__c LIMIT 1];
        UPDATE risk;
        System.runAs(u1){ 
            Client__c cli = [select Id ,Current_Availability__c, Last_Name__c  from Client__c where Last_Name__c='Participant2948' limit 1];
            ClientDataController.saveStatusData(TRUE, TRUE, cli.Id, 'Test Medications', 'Test Allergies', 'Test Notes', Date.newInstance(2024, 5, 16));
            ClientDataController.statusClient(cli.Id, 'true');
            //RiskMatrixController.
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/ParticipantSnapShotAPI/';
            req.httpMethod = 'GET';
            req.addParameter('participantID', cli.Id);
            RestContext.request = req;
            RestContext.response = res;
            
            Test.startTest();
            MobileAppSnapShotHandler.getParticipantSnapShot();
           
            
            MobileAppSnapShotHandler.StatusRequest status = new MobileAppSnapShotHandler.StatusRequest();
            status.participantID = cli.Id;
            status.isAvailable = true;
            status.isUnavailable = false;
            status.medications = 'Updated Meds';
            status.allergies = 'Updated Allergy';
            status.notes = 'Updated Notes';
            status.unavailableDate = Date.today().addDays(2);
            
            String jsonBody = JSON.serialize(status);
            
            RestRequest req1 = new RestRequest();
            RestResponse res1 = new RestResponse();
            req1.requestURI = '/services/apexrest/ParticipantSnapShotAPI/';
            req1.httpMethod = 'POST';
            req1.requestBody = Blob.valueOf(jsonBody);
            RestContext.request = req1;
            RestContext.response = res1;
           //   MobileAppSnapShotHandler.updateCheckListdata();
              
            RestRequest req2 = new RestRequest();
            RestResponse res2 = new RestResponse();
            req2.requestURI = '/services/apexrest/ParticipantSnapShotAPI/';
            req2.httpMethod = 'POST';
            req2.requestBody = Blob.valueOf('');
            RestContext.request = req2;
            RestContext.response = res2;
            
     
          //  MobileAppSnapShotHandler.updateCheckListdata();
            
              RestRequest req4 = new RestRequest();
            RestResponse res4 = new RestResponse();
            req4.requestURI = '/services/apexrest/ParticipantSnapShotAPI/';
            req4.httpMethod = 'GET';
            req4.addParameter('participantID', null);
            RestContext.request = req4;
            RestContext.response = res4;
            
         
            MobileAppSnapShotHandler.getParticipantSnapShot();
            Test.stopTest();
            
        }
    }
    
    @isTest
    static void testNoUpdateOnNonApproval() {
        // Retrieve the created staff and leave records
         User u1= [SELECT Id from User where email='manualtesting.4139562@hotmail.com' LIMIT 1];
        System.runAs(u1){ 
             Staff__c staff = [SELECT Id, Annual_Leave__c, Parental_Leave__c, Sick_Leave__c, Bereavement_Leave__c FROM Staff__c LIMIT 1];
            List<Leave__c> leaves = [SELECT Id, Staff__c, Status__c, Type_of_Leave__c, Duration__c FROM Leave__c where Staff__c=: staff.id   and From__c=:Date.newInstance(2024, 03, 16) ];
            
        // Simulate an update where the leave status does not change to 'Approved'
            for (Leave__c leave : leaves) {
                leave.Status__c = 'Approved';
            }
            
            update leaves;
            
           List<Leave__c> leaves1 = [SELECT Id, Staff__c, Status__c, Type_of_Leave__c, Duration__c FROM Leave__c where Staff__c=: staff.id   and From__c=:Date.newInstance(2024, 03, 18) ];
            
        // Simulate an update where the leave status does not change to 'Approved'
            for (Leave__c leave : leaves1) {
                leave.Status__c = 'Approved';
            }
            
            update leaves1;
            
            List<Leave__c> leaves2 = [SELECT Id, Staff__c, Status__c, Type_of_Leave__c, Duration__c FROM Leave__c where Staff__c=: staff.id   and From__c=:Date.newInstance(2024, 03, 20) ];
               // Simulate an update where the leave status does not change to 'Approved'
            for (Leave__c leave : leaves2) {
                leave.Status__c = 'Approved';
            }
            
            update leaves2;
         
        }
      
   
    }
    
  @isTest
    static void testExecute() {
         User u1= [SELECT Id from User where email='manualtesting.4139562@hotmail.com' LIMIT 1];
        System.runAs(u1){ 
        // Fetch the previously created shiftWithStaff
        ShiftwithStaff__c shiftWithStaff = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
        
        // Fetch recurred shifts
        List<ShiftwithStaff__c> recurredShifts = [SELECT Id, Date__c FROM ShiftwithStaff__c WHERE Id = :shiftWithStaff.Id];

        // Initialize the Queueable class with test data
        ServicesQueueableHandler queueable = new ServicesQueueableHandler(shiftWithStaff.Id, Date.today().addMonths(1), recurredShifts);
        
        // Enqueue the Queueable job
        Test.startTest();
        ID jobId = System.enqueueJob(queueable);
        Test.stopTest();
        
        // Verify if the service records have been created
        List<Services_and_Support_Plan__c> createdServices = [SELECT Id FROM Services_and_Support_Plan__c WHERE ShiftwithStaff__c IN :recurredShifts];
       // System.assert(createdServices.size() > 0, 'Recurring services should have been created');
    }   
  }
    
   @isTest
    static void getLeavesAPi(){
      User u1= [SELECT Id from User where email='manualtesting.4139562@hotmail.com' LIMIT 1];
        System.runAs(u1){ 
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/LeaveCalculationAPI';
            req.addParameter('fromDate','2024-12-24');
            req.addParameter('toDate', '2024-12-26');
            req.addParameter('leaveType', 'Annual Leave');
            
            RestContext.request = req;
            RestContext.response = res;
            MobileLeaveCalculator.getLeaveDuration();
           
        }
    }
    
      @IsTest
    static void testGetLeaveDurationInvalidDates() {
          User u1= [SELECT Id from User where email='manualtesting.4139562@hotmail.com' LIMIT 1];
        System.runAs(u1){ 
            // Set invalid date range
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/LeaveCalculationAPI';
            req.addParameter('fromDate','2024-12-28');
            req.addParameter('toDate', '2024-12-24');
            req.addParameter('leaveType', 'Sick Leave');
            
            RestContext.request = req;
            RestContext.response = res;
            MobileLeaveCalculator.getLeaveDuration();
            
            req.addParameter('fromDate','2024-03-16');
            req.addParameter('toDate', '2024-03-17');
            req.addParameter('leaveType', 'Sick Leave');
            
            RestContext.request = req;
            RestContext.response = res;
            MobileLeaveCalculator.getLeaveDuration();
            // Verify the response
        }
            
    }
    
      @IsTest
    static void testGetLeaveDurationNoStaffRecord() {
        // Simulate a user without staff details
        User userWithoutStaff = [SELECT Id FROM User WHERE Email = 'manualtesting.4139562@hotmail.com' LIMIT 1];
        System.runAs(userWithoutStaff) {
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/LeaveCalculationAPI';
            req.params.put('fromDate', Date.today().addDays(5).format());
            req.params.put('toDate', Date.today().addDays(7).format());
            req.params.put('leaveType', 'Annual Leave');
            
            RestContext.request = req;
            RestContext.response = res;
            
            // Call the method
            MobileLeaveCalculator.getLeaveDuration();

          
        }
    }
    
     @IsTest
    static void testGetLeavesSuccess() {
       User u1= [SELECT Id from User where email='manualtesting.4139562@hotmail.com' LIMIT 1];
        System.runAs(u1){ 
         Test.startTest();
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/LeaveCalculationAPI';
            req.params.put('year', String.valueOf(Date.today().year()));
            req.params.put('allleaves', 'true');
            req.params.put('pageNo', '1');
            RestContext.request = req;
            RestContext.response = res;
            MobileLeaveManagementHandler.getLeaves();
            
            req.params.put('year', 'invalidYear');
            RestContext.request = req;
            RestContext.response = res;
            MobileLeaveManagementHandler.getLeaves();
            
            req.params.put('year', String.valueOf(Date.today().year()));
            req.params.put('allleaves', 'false');
            req.params.put('pageNo', '1');
            RestContext.request = req;
            RestContext.response = res;
            MobileLeaveManagementHandler.getLeaves();
            
        Test.stopTest();
        }
    }
    
       @IsTest
    static void testInsertLeavesNewLeave() {
        User u1= [SELECT Id from User where email='manualtesting.4139562@hotmail.com' LIMIT 1];
        System.runAs(u1){ 
        Test.startTest();

        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
		req.requestURI = '/services/apexrest/LeaveCalculationAPI';
        // Prepare the leave wrapper JSON
        MobileLeaveManagementHandler.leaveWrapper wrapper = new MobileLeaveManagementHandler.leaveWrapper();
        wrapper.typeOfleave = 'Annual Leave';
        wrapper.reason = 'Vacation';
        wrapper.fromDate = Date.today().addDays(1);
        wrapper.toDate = Date.today().addDays(5);
        wrapper.duration = 5;
        wrapper.balance = 10;
        wrapper.paidLeave = 5;
        wrapper.unpaidLeave = 0;
        wrapper.status = 'Requested';
        wrapper.comments = 'Family trip';
        wrapper.isUpdate = false;
       // wrapper.fileName = 'payroll.pdf';
       // wrapper.base64 = '"JVBERi0xLjMKJbrfrOAKGFydHhyZWYKMTg2NTIKJSVFT0Y="';
            
        wrapper.staffId = [SELECT Id FROM Staff__c LIMIT 1].Id;

        req.requestBody = Blob.valueOf(JSON.serialize(wrapper));
        RestContext.request = req;
        RestContext.response = res;

        // Call the method
        MobileLeaveManagementHandler.insertLeaves();

        Test.stopTest();
        }
    }
    
     @IsTest
    static void testInsertLeavesUpdateLeave() {
        User u1= [SELECT Id from User where email='manualtesting.4139562@hotmail.com' LIMIT 1];
        System.runAs(u1){ 
            Test.startTest();
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/LeaveCalculationAPI';
            // Prepare the leave wrapper JSON
            MobileLeaveManagementHandler.leaveWrapper wrapper = new MobileLeaveManagementHandler.leaveWrapper();
            Leave__c leaveToUpdate = [SELECT Id FROM Leave__c LIMIT 1];
    
            wrapper.LeaveId = leaveToUpdate.Id;
            wrapper.status = 'Approved';
            wrapper.comments = 'Updated approval';
            wrapper.isUpdate = true;
    
            req.requestBody = Blob.valueOf(JSON.serialize(wrapper));
            RestContext.request = req;
            RestContext.response = res;
           
            MobileLeaveManagementHandler.insertLeaves();
         
    
    
            Test.stopTest();
        }
    }
    
     @isTest
    public static void createRecurringServicesTest() {
        // Setup user for running the test
        User use = [SELECT Id FROM User WHERE Email = 'manualtesting.4139562@hotmail.com' LIMIT 1];
      System.runAs(use) {
		Client__c clie = [SELECT Id from Client__c LIMIT 1];
        list<ShiftwithStaff__c> shift = [SELECT Id,Date__c FROM ShiftwithStaff__c];
       // Services_and_Support_Plan__c service = [SELECT ID From Services_and_Support_Plan__c LIMIT 1];
       
		 // Create additional ShiftwithStaff record
        Map<Id, Date> recurringDates = new Map<Id, Date>();
          for(ShiftwithStaff__c ss :shift){
              recurringDates.put(ss.Id, ss.Date__c);
          }
       ShiftwithStaff__c shiftStaff = [SELECT Id, Log_In_Date_Time__c, Log_Out_Date_Time__c FROM ShiftwithStaff__c WHERE Add_Shift__r.Start_Date__c = :Date.newInstance(2024, 10, 16)
            LIMIT 1
        ];
          Test.startTest();
          Map<Id, Date> recurringDates1 = new Map<Id, Date>{shiftStaff.Id => Date.newInstance(2024, 10, 16)};
         // Map<String, Object> response = RosterCreation.createRecurringServices(shiftStaff.Id, new List<ShiftwithStaff__c>{shiftStaff}, recurringDates1);
         // Map<String, Object> response1 = RosterCreation.createRecurringServices(shiftStaff.Id, shift, recurringDates1);
          
          Test.stopTest();
           List<Services_and_Support_Plan__c> insertedRecords = [SELECT Id, Date_of_Service__c, Client__c, State__c, Start_Time_24_Format__c, End_Time_24_Format__c, Service_Type__c, Qty__c FROM Services_and_Support_Plan__c WHERE ShiftwithStaff__c = :shiftStaff.Id
        ];
        System.assert(!insertedRecords.isEmpty(), 'Service support plan records should have been created.');
      // System.assertEquals(shiftStaff.Id, insertedRecords[0].ShiftwithStaff__c, 'Shift association should match.');
      }
    }
    
     @IsTest
    static void testGetLeavesFailure() {
       User u1= [SELECT Id from User where email='manualtesting.4139562@hotmail.com' LIMIT 1];
        System.runAs(u1){ 
         Test.startTest();
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/LeaveCalculationAPI';
           
            req.params.put('year', '');
            req.params.put('month', '');
            req.params.put('pageNo', '1');
             req.params.put('allleaves', 'true');
            RestContext.request = req;
            RestContext.response = res;
            MobileLeaveManagementHandler.getLeaves();
        Test.stopTest();
        }
    }
    
     @isTest
    static void testGetServicesAndSupportPlansforDashboard() {
        // Fetch test user
        User testUser = [SELECT Id FROM User WHERE Email = 'manualtesting.4139562@hotmail.com' LIMIT 1];
        System.runAs(testUser){ 

        Test.startTest();
        
        // Call the method with the User ID
        List<Id> userIds = new List<Id>{ testUser.Id };
        List<ServiceSupportPlanHandler.ServiceAndSupportPlanWrapper> results = ServiceSupportPlanHandler.getServicesAndSupportPlansforDashboard(userIds);
        
        Test.stopTest();
        }
        

    }
    
     @IsTest
    public static void testServiceAndSupportPlanWrapper() {
        // Create mock data
         list<Services_and_Support_Plan__c> sspList=[Select id,Services__c,Funds_Tracker__c,Amount__c,Services_name__c,Status__c,Start_Date__c,End_Date__c,Date_of_Service__c,Client__c,Service_Type__c,Qty__c,ShiftwithStaff__c from Services_and_Support_Plan__c ];
        Id mockId = sspList[0].Id; // Fake Id for testing
        String resourceName = 'Test Resource';
        String serviceType = 'Test Service';
        Date serviceDate = Date.today();
        Decimal quantity = 5.0;
        String startDateTime = '2024-02-19T08:00:00Z';
        String endDateTime = '2024-02-19T10:00:00Z';

        // Instantiate the wrapper class
    /*    ServiceSupportPlanHandler.ServiceAndSupportPlanWrapper wrapperInstance = new ServiceSupportPlanHandler.ServiceAndSupportPlanWrapper(
            mockId,
            resourceName,
            serviceType,
            serviceDate,
            quantity,
            startDateTime,
            endDateTime
        );*/

        // Assert that values are correctly assigned

    }
    @isTest
    static void testGetRiskMatrix() {
        Test.startTest();
        Map<String, String> riskMatrix = RiskMatrixController.getRiskMatrix();
        Test.stopTest();
    }
      @isTest
    static void testInsertRiskRecords() {
        // Create a dynamic JSON input for the test
        User use = [SELECT Id FROM User WHERE Email = 'manualtesting.4139562@hotmail.com' LIMIT 1];
        System.runAs(use) {
            Client__c clie = [SELECT Id from Client__c LIMIT 1];
            String riskRecordsJson = '[{"area":"Manual Handling","category":"Posture/Repetitive Movements","impact":"Participant","likelihood":"Frequent","consequences":"Insignificant","riskRating":"Medium","strategy":"GFDSA","responsiblePerson":"LKJHGFD","dateCompleted":"2024-03-07","clientId":"' +clie.Id + '","uniqueId":"RISK456","fileName":"safety_plan.pdf","otherText":"Test Comments"}]';
            Organisation__c orgs =[SELECT Id From Organisation__c LIMIT 1];
            String orgId = orgs.Id;
            
            List<Facility__c> facList = [SELECT ID from Facility__c];
            List<String> facString = new List<String>();
            for(Facility__c fac:facList){
                facString.add(fac.ID);
            }
            
            Date startDate = Date.newInstance(2025, 09, 14);
            Date endDate = Date.newInstance(2025, 09, 30);
            
            String jsonData = '[{"day":"Mon","isHoliday":false,"quantity":1,"todayLabel":"NotToday","unallocated":0,"weekDays":"02-06-2025"},{"day":"Tue","isHoliday":false,"quantity":2,"todayLabel":"NotToday","unallocated":0,"weekDays":"03-06-2025"},{"day":"Wed","isHoliday":false,"quantity":2,"todayLabel":"NotToday","unallocated":0,"weekDays":"04-06-2025"},{"day":"Thu","isHoliday":false,"quantity":3,"todayLabel":"NotToday","unallocated":0,"weekDays":"05-06-2025"},{"day":"Fri","isHoliday":false,"quantity":3,"todayLabel":"NotToday","unallocated":1,"weekDays":"06-06-2025"},{"day":"Sat","isHoliday":false,"quantity":4,"todayLabel":"NotToday","unallocated":0,"weekDays":"07-06-2025"},{"day":"Sun","isHoliday":false,"quantity":1,"todayLabel":"NotToday","unallocated":0,"weekDays":"08-06-2025"}]';
            Staff__c stff = [SELECT ID from Staff__c where Email_Address__c='manualtesting.4139562@hotmail.com' ];
            String staffId = stff.ID;
            ShiftwithStaff__c shiftStaff = [SELECT Id, Log_In_Date_Time__c, Log_Out_Date_Time__c FROM ShiftwithStaff__c LIMIT 1];
          	String shiftStaffId = shiftStaff.ID;
            Test.startTest();
            	List<Risk_Management__c> insertedRecords = RiskMatrixController.insertRiskRecords(riskRecordsJson);
              	list<string> shiftType= new list<string>{'General'};
                list<string> StatusList= new list<string>();
            	AddShiftParticipantView.totalParticipantDetailsWrapper tpw=  AddShiftParticipantView.getParticipantData(startDate, endDate, facString, orgId, jsonData, '',shiftType,StatusList);
            	AddShiftParticipantView.getOverlappingShiftsData('3:30 am', '5:30 am', staffId,'2025-06-25' , 'General',shiftStaffId);
            	AddShiftParticipantView.getOverlappingShiftsData(null, null, staffId,'2025-06-25' , 'General',shiftStaffId);
                AddShiftParticipantView.getShiftTypes(facString);
               
            
            Test.stopTest();
        }
    }
     @isTest
    static void testUpdateStaffAssignments_WithRoleData() {
        // Get test data
        Client__c client = [SELECT Id FROM Client__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        
        // Prepare the exact JSON structure
        String assignmentsJSON = '[{' +
            '"Id": "' + staff.Id + '",' +
            '"Name": "wexeret wexeret",' +
            '"rowClass": "slds-hint-parent slds-theme_shade",' +
            '"roleData": [' +
                '{"roleId": "Support Worker", "roleName": "Support Worker", "hasRole": false, "hasRoleinstaff": false},' +
                '{"roleId": "Registered Nurse", "roleName": "Registered Nurse", "hasRole": false, "hasRoleinstaff": false},' +
                '{"roleId": "Human Resources", "roleName": "Human Resources", "hasRole": false, "hasRoleinstaff": false},' +
                '{"roleId": "Roster Manager", "roleName": "Roster Manager", "hasRole": false, "hasRoleinstaff": false},' +
                '{"roleId": "AIN", "roleName": "AIN", "hasRole": false, "hasRoleinstaff": false},' +
                '{"roleId": "Admin", "roleName": "Admin", "hasRole": false, "hasRoleinstaff": false},' +
                '{"roleId": "EEN", "roleName": "EEN", "hasRole": false, "hasRoleinstaff": false}' +
            ']' +
        '}]';
        
        String assignmentsJSON1 = '[{' +
            '"Id": "' + staff.Id + '",' +
            '"Name": "Test Staff",' +
            '"rowClass": "slds-hint-parent slds-theme_shade",' +
            '"roleAssignments": {' +
                '"Support Worker": true,' +
                '"Admin": false,' +
                '"EEN": true' +
            '}' +
        '}]';

        Test.startTest();
        ClientDataController.updateStaffAssignments(client.Id, assignmentsJSON1);
        Test.stopTest();

        // Verify results - should create records for all roles with hasRole=true
        List<Participant_Staff_Association__c> results = [
            SELECT Id, Role__c, Active__c 
            FROM Participant_Staff_Association__c 
            WHERE Participant__c = :client.Id AND Staff__c = :staff.Id
        ];

       
    }

    @isTest
    static void testUpdateStaffAssignments_WithSomeActiveRoles() {
        // Get test data
        Client__c client = [SELECT Id FROM Client__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        
        // Modified JSON with some active roles
        String assignmentsJSON = '[{' +
            '"Id": "' + staff.Id + '",' +
            '"Name": "wexeret wexeret",' +
            '"rowClass": "slds-hint-parent slds-theme_shade",' +
            '"roleData": [' +
                '{"roleId": "Support Worker", "roleName": "Support Worker", "hasRole": true, "hasRoleinstaff": false},' +
                '{"roleId": "Registered Nurse", "roleName": "Registered Nurse", "hasRole": false, "hasRoleinstaff": false},' +
                '{"roleId": "Admin", "roleName": "Admin", "hasRole": true, "hasRoleinstaff": false}' +
            ']' +
        '}]';

        Test.startTest();
        ClientDataController.updateStaffAssignments(client.Id, assignmentsJSON);
        Test.stopTest();

        // Verify results
        List<Participant_Staff_Association__c> results = [
            SELECT Role__c, Active__c 
            FROM Participant_Staff_Association__c 
            WHERE Participant__c = :client.Id AND Staff__c = :staff.Id
            ORDER BY Role__c
        ];

       
    }
    
      
}