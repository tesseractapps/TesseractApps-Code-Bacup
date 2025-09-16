@isTest
public class AWSS3FileUploadControllerTest {
    @isTest
    private static void GetRate_SuccessResponse_ShouldReturnRateAsDecimal() {
        Test.startTest();
        // Setup
        
        StaticResourceCalloutMock mockCallout = new StaticResourceCalloutMock();
        mockCallout.setStaticResource('myResource');
        mockCallout.setStatusCode(200);
        mockCallout.setHeader('Content-Type', 'application/json');
        
        // Set the mock callout mode
        Test.setMock(HttpCalloutMock.class, mockCallout);
        
        // Test
        // Configure the mock to be the response-provider during the test.
        
        // Test that the service processes the fake O response
        // and returns a simple Decimal exchange rate.
        String base64 ='"JVBERi0xLjMKJbrfrOAKGFydHhyZWYKMTg2NTIKJSVFT0Y="';
        String filename ='payroll.pdf';
        
        Organisation__c org = OrgDetailsTest.createOrganization();
        List<Facility__c> facilityList = FacilityControllerTest.createFacility(org.Id);
        System.debug(facilityList[0]);
       // Organisation__c orgRec =[select id,name from Organisation__c where id=:facilityList[0].Organisation__c];
        List<Staff__c> staffRec = new List<Staff__c>();
        staffRec = StaffControllerTest.createStaff(facilityList[0].id);
        List<String> ids = new List<String>();
        for(Staff__c staf:staffRec){
            ids.add(staf.Id);
        }
        
        List<Payroll_Setting__c>  payrollList = PayrollSettingSchedularTest.createPayRollSetting(facilityList[0].Id);
        Payroll_Setting__c payrollSetting = new Payroll_Setting__c(Id=payrollList[0].Id);
        payrollSetting.Facility__c=facilityList[0].id;
        payrollSetting.Status__c='';
        update payrollSetting;
        
        List<Staff_Payroll_Setting__c> staffPayList = PayrollSettingSchedularTest.createStaffPayRollSetting(payrollList[0].Id,ids);
        Repository__c repositoryRec = new  Repository__c();
        repositoryRec.Name='test attachment';
        repositoryRec.Date__c=Date.newInstance(2023, 11, 07);
        repositoryRec.Type__c='Certificate';
       // repositoryRec.User__c=UserInfo.getUserId();
        repositoryRec.Comments__c='Test Comments';
        repositoryRec.Amazon_file_URL__c='https://datainfo.s3.ap-southeast-2.amazonaws.com/inv-00522.pdf';
        repositoryRec.Size__c='0.12 MB';
        insert repositoryRec;
        Repository__c rep=[select id from Repository__c limit 1];
        
        /*Reimbursement__c pat= new Reimbursement__c();
        pat.Mileage__c='50';
        pat.Comments__c='test';
        pat.Others__c='others';
        insert pat;
        Reimbursement__c reim=[select id from Reimbursement__c limit 1]; */
        
        Child_Staff__c cs = new Child_Staff__c ();
        cs.Expiry_Date__c=Date.newInstance(2024, 11, 07);
        cs.Type__c='Other';
        cs.File_Name__c='testFile.png';
        cs.Comments__c='test Comments';
        cs.Staff__c=ids[0];
        insert cs;
        Child_Staff__c childStaff=[select id from Child_Staff__c limit 1];
        
        Invoice_Parent__c invParent = new Invoice_Parent__c();
        invParent.Organization__c = org.Id;
        insert invParent;
        
         RFQ__c rfq = new RFQ__c();
            rfq.Organization__c=org.Id;
            rfq.Date_Issued__c=System.today();
            rfq.Include_GST__c = 'No';
            rfq.Email_Sent__c=false;
            insert rfq;  
        
        Case cas = new Case();
        cas.Organization__c = org.Id;
        insert cas;
        Case cases =[SELECT ID from Case LIMIT 1];
        
        Expenses__c exp = new Expenses__c();
        exp.Type_of_Expense__c = 'Rent';
        exp.Amount__c = 1000;
        exp.Facility__c =facilityList[0].id;
        insert exp; 
        
        Attachment__c atta = new Attachment__c();
        atta.Name = 'Test Attachment';
        atta.Type__c = 'Certificate';
        insert atta;
        
        Facility__c fac = new Facility__c();
        fac.Name='Ashfield Consultants';
        fac.Address__City__s='Crace';
        fac.Address__Street__s = '8 Keewong Street';
        fac.Address__StateCode__s='ACT';
        fac.Address__PostalCode__s='2911';
        fac.Address__CountryCode__s='AU';
        fac.Email__c= 'testonefacility@gmail.com';
        fac.Status__c=true;
        fac.Services__c	= 'Personal Care';
        fac.ABN__c='12234567';
            fac.Phone__c = '12323432';
        insert fac;
        
     
        
        Service_Agreement__c ser = new Service_Agreement__c();
        ser.Comments__c = 'Test Comments';
        insert ser;
        
        Service_Invoice__c serInv = new Service_Invoice__c();
        serInv.Amount__c = 1200;
        serInv.Description__c = 'Test Description';
        insert serInv;
        
        Training__c tr = new Training__c();
        tr.description__c = 'Test Description';
        insert tr;
        
        Risk_Management__c rs= new Risk_Management__c();
        rs.Area__c ='Test Area';  
        rs.Category__c='test ';
        rs.Impact_on_Whom__c ='Participant';
        rs.Likelihood__c = 'Frequent';
        rs.Consequences__c = 'Insignificant';
        rs.Risk_Index__c = 'High';
        rs.Risk_Strategy__c = 'test test';
        rs.Person_Responsible__c = 'test test';
        rs.Date_Completed__c =Date.valueof('2025-05-10');
        // rs.Participant__c = risk.clientId,
        rs.UniqueRefId__c ='1256355';
        rs.File_Name__c = 'file name ';
        rs.Other_Text__c = 'other ';
        insert rs;
       
      
    
     
        
        Offer_Template__c offerTemplate= new Offer_Template__c();
        offerTemplate.Amazon_Url__c='https://docimgupld.s3.ap-southeast-2.amazonaws.com/tesseractoffer-10page.pdf';
        offerTemplate.All_Recipients__c='praveenshesham.sp@gmail.com '+'\n'+'praveenshesham@tesseractapps.com';
        insert offerTemplate;
       /* Child_Signatures__c cs= new Child_Signatures__c();
        cs.Offer_Template__c=offerTemplate.ID;
        cs.Recipient_Email__c='praveenshesham.sp@gmail.com';
        cs.Signature_URL__c='https://docimgupld.s3.ap-southeast-2.amazonaws.com/tesseractoffer-10page.pdf';
        insert cs; */
        
        AWSS3FileUploadController.UploadDocument(base64, filename, staffPayList[0].Id,'audit');
        AWSS3FileUploadController.uploadFile(base64, filename, staffPayList[0].Id,'TestSubject');
        AWSS3FileUploadController.UploadDocument(base64, filename, rep.Id,'rep');
        AWSS3FileUploadController.UploadDocument(base64, filename, childStaff.Id,'ChildStaff');
       //AWSS3FileUploadController.UploadDocument(base64, filename, reim.Id,'reimburse');
        AWSS3FileUploadController.UploadDocument(base64, filename, invParent.Id,'invoiceParent');
		AWSS3FileUploadController.UploadDocument(base64, filename, cases.Id,'case');
        AWSS3FileUploadController.UploadDocument(base64, filename, exp.Id,'expense');
        AWSS3FileUploadController.UploadDocument(base64, filename, atta.Id,'attach');
        AWSS3FileUploadController.UploadDocument(base64, filename, ser.Id,'agree');
        AWSS3FileUploadController.UploadDocument(base64, filename, serInv.Id,'invoice');
        AWSS3FileUploadController.UploadDocument(base64, filename, tr.Id,'hrtraining');
        AWSS3FileUploadController.UploadDocument(base64, filename, fac.Id,'facility');
        AWSS3FileUploadController.UploadDocument(base64, filename, rfq.Id,'RFQ');
        AWSS3FileUploadController.UploadDocument(base64, filename, offerTemplate.Id,'OfferLetter');
        AWSS3FileUploadController.UploadDocument(base64, filename, cs.Id,'ChildSignature');
          AWSS3FileUploadController.UploadDocument(base64, filename, rs.Id,'RiskRecords');
         // AWSS3FileUploadController.UploadDocument(base64, filename, Aw.Id,'Award');
		//AWSS3FileUploadController.UploadDocument(base64, filename, rs.Id,'Attachment');
		        
        
        AWSServiceFileService aws = new AWSServiceFileService(System.Label.AWSKey, System.Label.AWSSecret, System.Label.AWSBucket, System.Label.AWSHost, System.Label.AWSMethod);
        aws.ContentType('docx');
        aws.ContentType('csv');
        aws.ContentType('wav');
        aws.ContentType('wmv');
        aws.ContentType('mp3');
        aws.ContentType('mp4');
        aws.ContentType('png');
        aws.ContentType('pdf');
        aws.ContentType('gif');
        String formattedDateString = Datetime.now().formatGMT('EEE, dd MMM yyyy HH:mm:ss z');
        aws.CreateAuthHeader('.pdf', filename, formattedDateString, '.pdf');
        
        BaseException.dummy();
        Test.stopTest();
        
        
    }
    
}