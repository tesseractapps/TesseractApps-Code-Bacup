@isTest
public class ICTTimeSheetInboundEmailHandlerTestClass {
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
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtest.3257124@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='Test Friday7', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtest.3257124@hotmail.com',Organization_Name__c ='Ashfield Consultants');
         insert user;
        System.runAs(user) { 
            Facility__c fac = new Facility__c();
            fac.Name='Pinnacle IT';
            fac.Address__City__s='Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s='ACT';
            fac.Address__PostalCode__s='2911';
            fac.Email__c= 'testfacility@gmail.com';
            fac.Status__c=true;
            fac.Organisation__c= org.Id;
            fac.ABN__c='12234567';
            fac.Phone__c = '12323432';
            insert fac;
            
            Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test staff';
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtest.3257124@hotmail.com';
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
            insert staff; 
            
            ICT_TimeSheet__c ictRec= new ICT_TimeSheet__c();
            ictRec.Week_Start_Date__c=date.newInstance(2024, 01, 15);
            ictRec.Week_end_Date__c=date.newInstance(2024, 01, 21);
            ictRec.Staff__c=staff.id;
            ictRec.Status__c='Submitted';
            ictRec.Total_Duration__c=4;
            insert ictRec;
            
            Allocation__c alocRec=new Allocation__c();
            alocRec.End_Date__c=date.newInstance(2024, 01, 16);
            alocRec.Start_Date__c=date.newInstance(2024, 01, 16);
           // alocRec.Start_time__c='4:30 pm';
            alocRec.Start_Date_Time__c=Time.newInstance(16, 30, 00, 00);
           // alocRec.End_time__c='6:30 pm';
            alocRec.End_Date_Time__c=Time.newInstance(18, 30, 00, 00);
            alocRec.Working_Hours__c=2;
            alocRec.Staff__c=staff.id;
            alocRec.Status__c='Draft';
            alocRec.ICT_TimeSheet__c=ictRec.id;
            insert alocRec; 
            
            Allocation__c alocRec1=new Allocation__c();
            alocRec1.End_Date__c=date.newInstance(2024, 01, 16);
            alocRec1.Start_Date__c=date.newInstance(2024, 01, 16);
            //alocRec1.Start_time__c='4:30 pm';
            alocRec1.Start_Date_Time__c=Time.newInstance(16, 30, 00, 00);
           // alocRec1.End_time__c='6:30 pm';
            alocRec1.End_Date_Time__c=Time.newInstance(18, 30, 00, 00);
            alocRec1.Working_Hours__c=2;
            alocRec1.Staff__c=staff.id;
            alocRec1.Status__c='Draft';
            alocRec1.ICT_TimeSheet__c=ictRec.id;
            insert alocRec1;
             // Additional setup for approved case
        ICT_TimeSheet__c ictRecApproved = new ICT_TimeSheet__c(
            Week_Start_Date__c = Date.newInstance(2024, 01, 15),
            Week_end_Date__c = Date.newInstance(2024, 01, 21),
            Staff__c = staff.id,
            Status__c = 'Approved',
            Total_Duration__c = 4
        );
        insert ictRecApproved;

        // Additional setup for rejected case
        ICT_TimeSheet__c ictRecRejected = new ICT_TimeSheet__c(
            Week_Start_Date__c = Date.newInstance(2024, 01, 15),
            Week_end_Date__c = Date.newInstance(2024, 01, 21),
            Staff__c = staff.id,
            Status__c = 'Rejected',
            Total_Duration__c = 4
        );
        insert ictRecRejected;

        Allocation__c alocRecRejected = new Allocation__c(
            End_Date__c = Date.newInstance(2024, 01, 16),
            Start_Date__c = Date.newInstance(2024, 01, 16),
           // Start_time__c = '4:30 pm',
            Start_Date_Time__c = Time.newInstance(16, 30, 00, 00),
          //  End_time__c = '6:30 pm',
            End_Date_Time__c = Time.newInstance(18, 30, 00, 00),
            Working_Hours__c = 2,
            Staff__c = staff.id,
            Status__c = 'Draft',
            ICT_TimeSheet__c = ictRecRejected.id
        );
        insert alocRecRejected;
        }
     }

    @isTest
    public static void testMethodRejected() {
        ICT_TimeSheet__c ictRec = [SELECT Id, name,Status__c, Comments__c FROM ICT_TimeSheet__c where Status__c='Submitted' limit 1];

        // Create inbound email
        Messaging.InboundEmail email = new Messaging.InboundEmail();
        email.subject = 'test subject Shesham Praveen Timesheet ' + ictRec.name;
        email.fromAddress = 'praveen.shesham@pinnacleitservices.com';
        email.plainTextBody = 'Rejected:test comments\n\n\n';

        // Execute handler
        Test.startTest();
        ICTTimeSheetInboundEmailHandler testInbound = new ICTTimeSheetInboundEmailHandler();
        testInbound.handleInboundEmail(email, new Messaging.InboundEnvelope());
        Test.stopTest();

    }
    @isTest
    public static void testMethodApproved() {
        ICT_TimeSheet__c ictRec = [SELECT Id, name,Status__c, Comments__c FROM ICT_TimeSheet__c where Status__c='Submitted' limit 1];

        // Create inbound email
        Messaging.InboundEmail email = new Messaging.InboundEmail();
        email.subject = 'test subject Shesham Praveen Timesheet ' + ictRec.name;
        email.fromAddress = 'praveen.shesham@pinnacleitservices.com';
        email.plainTextBody = 'Approved';

        // Execute handler
        Test.startTest();
        ICTTimeSheetInboundEmailHandler testInbound = new ICTTimeSheetInboundEmailHandler();
        testInbound.handleInboundEmail(email, new Messaging.InboundEnvelope());
        Test.stopTest();

    }
}