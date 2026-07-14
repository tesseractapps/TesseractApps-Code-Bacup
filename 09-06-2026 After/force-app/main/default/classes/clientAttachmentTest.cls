@isTest
public class clientAttachmentTest{
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
        org.User_Type__c = 'NDIS Staff';
        org.Contact_Name__c = 'Test Contact';
        insert org;
        
        //system.debug(org.name);
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.209721@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne20972', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.209721@hotmail.com',Organization_Name__c ='Ashfield Consultants');
        insert user;
        
        System.runAs(user){  
            Facility__c fac = new Facility__c();
            fac.Name='Ashfield Consultants';
            fac.Address__City__s='Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s='ACT';
            fac.Address__PostalCode__s='2911';
            fac.Address__CountryCode__s='AU';
            fac.ABN__c ='12345678765';
            fac.Email__c= 'testonefacility@gmail.com';
            fac.Status__c=true;
            fac.Phone__c = '12323213';
            fac.Organisation__c= org.Id;
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
            cli.Last_Name__c = 'Participant';
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
            cli.Primary_Contact_Number__c='0433123123';
            insert cli;
            
            Attachment__c attach = new  Attachment__c();
            attach.Added_By__c=cli.Id;
            attach.Name='test attachment';
            attach.Date__c=Date.newInstance(2023, 11, 07);
            attach.Type__c='Certificate';
            attach.Type_of_Document__c='GP Cerificate';
            attach.User__c=UserInfo.getUserId();
            attach.Comments__c='Test Comments';
            attach.Amazon_file_URL__c='https://datainfo.s3.ap-southeast-2.amazonaws.com/inv-00522.pdf';
            attach.Size__c='0.12 MB';
            attach.Is_Archived__c=true;
            attach.Archived_Date__c = Date.today();
            insert attach;
            
            Attachment_Folder__c attac = new Attachment_Folder__c();
            attac.Participant__c = cli.Id;
            insert attac;
            
            Folder_Share__c folderShare = new Folder_Share__c();
            folderShare.Active__c = TRUE;
            //folderShare.Attachment_Folder__c = attac.Id;
            folderShare.Staff__c = staff.Id;
            folderShare.Full_Folder_Access__c = TRUE;
            insert folderShare;
            
            // Create a test ContentVersion
            ContentVersion cv = new ContentVersion();
            cv.Title = 'Test Document';
            cv.PathOnClient = 'test-document.pdf';        
            cv.VersionData = Blob.valueOf('Test content of the document.');
            cv.IsMajorVersion = true;
            insert cv;
            //Get Content Documents
            Id conDocId = [SELECT ContentDocumentId FROM ContentVersion WHERE Id =:cv.Id].ContentDocumentId;
            // Create a ContentDocumentLink to associate the ContentVersion with the test record
            ContentDocumentLink cdl = new ContentDocumentLink();
            cdl.ContentDocumentId = conDocId;
            cdl.LinkedEntityId = attach.Id;
            cdl.ShareType = 'V';
            cdl.Visibility = 'AllUsers';
            insert cdl;  
            ContentDocumentLink resultCdl = [SELECT Id, ContentDocumentId FROM ContentDocumentLink WHERE LinkedEntityId = :attach.Id LIMIT 1];  
            Attachment__c attachmentRec = new  Attachment__c();
            attachmentRec.Added_By__c=cli.Id;
            attachmentRec.Name='test attachment';
            attachmentRec.Date__c=Date.newInstance(2023, 11, 07);
            attachmentRec.Type__c='Certificate';
            attachmentRec.Type_of_Document__c='GP Cerificate';
            attachmentRec.User__c=UserInfo.getUserId();
            attachmentRec.Comments__c='Test Comments';
            attachmentRec.Amazon_file_URL__c='https://datainfo.s3.ap-southeast-2.amazonaws.com/inv-00522.pdf';
            attachmentRec.Size__c='0.12 MB';
            insert attachmentRec;
        }
    }
    @isTest
    public static void TestfetchFiles(){
        
        User u2= [SELECT Id from User where email='manualtesting.209721@hotmail.com' LIMIT 1];
        System.runAs(u2){
            Client__c cli = [select Id from Client__c];
            string recordId = cli.Id;     
            Attachment__c attac = [SELECT Id,Name,Type__c, Size__c,comments__c,USer_Name__c,Amazon_file_URL__c,Date__c,Date_Format__c from Attachment__c limit 1];
            
            test.startTest();
            ClientAttachmentHandler.fetchClientFiles(recordId);
            ClientAttachmentHandler.getRelatedFilesByRecordId(recordId);
            ClientAttachmentHandler.fetchRepositoryData(recordId);
            ClientAttachmentHandler.deleteRepository(attac.Id);
            Attachment__c attachmentRec= [SELECT Id,Name,Type__c, Size__c,comments__c,USer_Name__c,Amazon_file_URL__c,Date__c,Date_Format__c from Attachment__c limit 1];
            ClientAttachmentHandler.UpdateFileSize(attachmentRec.id, '0.12MB'); //getFolders
            ClientAttachmentHandler.getFolders(recordId);
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.params.put('ParticipantId',recordId);
            req.requestURI = 'https://pinnacleit--tesseract.sandbox.lightning.force.com/services/apexrest/ParticipantAttachment/';
            RestContext.request = req;
            RestContext.response = res;
            List<Attachment__c> clientattch= mobileAppParticipantAttatchment.getClientAttatchment();
             
            
            test.StopTest(); 
        }
        
        
    }
    @isTest
    static void test_fetchStaffByDoc() {
        
        // 🔹 Get existing data from your testSetup
        Attachment__c att = [SELECT Id, Added_By__c FROM Attachment__c LIMIT 1];
        Client__c cli = [SELECT Id, Facility__c FROM Client__c LIMIT 1];
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        
        // 🔥 IMPORTANT FIX 1 → link Client to Facility
        cli.Facility__c = fac.Id;
        update cli;
        
        // 🔥 IMPORTANT FIX 2 → update Staff fields required by query
        staff.Status__c = true;
        staff.User_Type__c = 'NDIS Staff';
        update staff;
        
        // 🔥 IMPORTANT FIX 3 → create Staff-Facility mapping
        Staff_Facility__c sf = new Staff_Facility__c(
            Staff__c = staff.Id,
            Facility__c = fac.Id
        );
        insert sf;
        
        // 🔥 OPTIONAL → create share record (to test exclusion)
        Participant_Docs_Share__c share = new Participant_Docs_Share__c(
            Attachment__c = att.Id,
            Staff__c = staff.Id
        );
        insert share;
        
        Test.startTest();
        
        List<Participant_Docs_Share__c> result =
            ClientAttachmentHandler.fetchStaffByDoc(att.Id);
        
        Test.stopTest();
    }
    @isTest
static void test_saveParticipantDocShares() {

    User u =
        [SELECT Id
         FROM User
         WHERE Email =
            'manualtesting.209721@hotmail.com'
         LIMIT 1];

    System.runAs(u) {

        Client__c cli =
            [SELECT Id
             FROM Client__c
             LIMIT 1];

        Staff__c st =
            [SELECT Id
             FROM Staff__c
             LIMIT 1];

        Attachment_Folder__c folder =
            new Attachment_Folder__c(
                Participant__c = cli.Id
            );

        insert folder;

        Attachment__c att =
            new Attachment__c(
                Added_By__c = cli.Id,
                Name = 'Folder Test',
                Date__c = Date.today(),
                Type__c = 'Certificate',
                Type_of_Document__c ='Date of Birth Certificate',
                User__c = UserInfo.getUserId(),
                Comments__c = 'Test',
                Amazon_file_URL__c =
                    'https://test.com/file.pdf',
                Size__c = '1 MB',
                Attachment_Folder__c =
                    folder.Id
            );

        insert att;

        Test.startTest();

        ClientAttachmentHandler.saveParticipantDocShares(
                att.Id,
                new List<Id>{ st.Id }
            );

        ClientAttachmentHandler.saveParticipantDocShares(
                att.Id,
                new List<Id>{ st.Id }
            );

        Test.stopTest();

        List<Participant_Docs_Share__c> shares = [

            SELECT Id, Staff__c
            FROM Participant_Docs_Share__c
            WHERE Attachment__c = :att.Id
        ];
    }
}
    @isTest
    static void test_fetchAttachmentsForStaff() {
        User u = [SELECT Id FROM User WHERE Email = 'manualtesting.209721@hotmail.com' LIMIT 1];
        Attachment_Folder__c atta= [SELECT Id FROM Attachment_Folder__c];        
        Id folderId = atta.Id;
        
        Attachment__c att = [SELECT Id,Is_Archived__c,Archived_Date__c FROM Attachment__c LIMIT 1];
        List<Attachment__c> attList = [SELECT Id,Is_Archived__c,Archived_Date__c FROM Attachment__c LIMIT 1];
        Id contactIds = attList[0].Id;
        Folder_Share__c folder = [SELECT ID FROM Folder_Share__c];
                
        List<Staff__c> staffList = [SELECT Id FROM Staff__c LIMIT 1];        
        Id staffId = staffList[0].Id;
        System.runAs(u) {
            Client__c cli = [SELECT Id FROM Client__c LIMIT 1];
            Test.startTest();
            List<Attachment__c> result = ClientAttachmentHandler.fetchAttachmentsForStaff(cli.Id,folderId);
            ClientAttachmentHandler.createFolder('File Name', folderId, cli.Id); //canDeleteFolder
            ClientAttachmentHandler.updateFolderName(folderId, 'Test1'); //folder
            ClientAttachmentHandler.loadContacts(cli.Id);
            ClientAttachmentHandler.deleteContactAttachment(att.Id);
            ClientAttachmentHandler.getContactAttachments(att.Id);
            ClientAttachmentHandler.getAllContactAttachments(cli.Id); 
            ClientAttachmentHandler.getContactAttachmentCounts(new List<Id>{ contactIds });
            ClientAttachmentHandler.saveFolderShares(atta.Id, new List<Id>{ staffId });
            ClientAttachmentHandler.fetchFolderSharedStaff(folder.Id);
           // ClientAttachmentHandler.archiveAttachment(att.Id);
           // ClientAttachmentHandler.restoreAttachment(att.Id);
            ClientAttachmentHandler.getArchivedAttachments(cli.Id, folder.Id);
            ClientAttachmentHandler.canDeleteFolder(folder.Id);
            ClientAttachmentHandler.deleteFolder(folder.Id);
            Test.stopTest();
        }
    }
@isTest
static void test_fetchClientAttachmentsSecure() {

    User u = [
        SELECT Id, Email, User_Type__c
        FROM User
        WHERE Email =
            'manualtesting.209721@hotmail.com'
        LIMIT 1
    ];

    // IMPORTANT
    // Use NON org admin so this block executes
    u.User_Type__c = 'NDIS Staff';
    update u;

    Staff__c st = [
        SELECT Id, Email_Address__c, Status__c
        FROM Staff__c
        LIMIT 1
    ];

    st.Email_Address__c = u.Email;
    st.Status__c = true;
    update st;

    Attachment_Folder__c atta = [
        SELECT Id
        FROM Attachment_Folder__c
        LIMIT 1
    ];

    Id folderId = atta.Id;

    System.runAs(u) {

        Client__c cli = [
            SELECT Id
            FROM Client__c
            LIMIT 1
        ];

        // CREATE ATTACHMENT
        // This is REQUIRED for visibleAttachmentIds
        Attachment__c att = new Attachment__c(
            Added_By__c = cli.Id,
            Name = 'Secure Test',
            Date__c = Date.today(),
            Type__c = 'Certificate',
            Type_of_Document__c =
                'GP Cerificate',
            User__c = u.Id,
            Comments__c = 'Test',
            Amazon_file_URL__c =
                'https://test.com/file.pdf',
            Size__c = '1 MB',
            Attachment_Folder__c = folderId,
            Is_Archived__c = false
        );

        insert att;

        // OPTIONAL
        // Covers shared attachment logic too
        Participant_Docs_Share__c share =
            new Participant_Docs_Share__c(
                Attachment__c = att.Id,
                Staff__c = st.Id,
                Is_Active__c = true
            );

        insert share;

        Test.startTest();

        List<Attachment__c> result =
            ClientAttachmentHandler.fetchClientAttachmentsSecure(
                    cli.Id,
                    folderId
                );

        Test.stopTest();

        
    }
}
    @isTest
    static void test_deleteRepository_null() {
    
        Test.startTest();
    
        ClientAttachmentHandler.deleteRepository(null);
        ClientAttachmentHandler.deleteRepository('');
    
        Test.stopTest();
    }
    
    @isTest
static void test_archiveAndRestoreAttachment() {

    User u =
        [SELECT Id
         FROM User
         WHERE Email =
            'manualtesting.209721@hotmail.com'
         LIMIT 1];

    System.runAs(u) {

        Attachment__c att =
            [SELECT Id,
                    Is_Archived__c,
                    Archived_Date__c
             FROM Attachment__c
             LIMIT 1];

        Staff__c st =
            [SELECT Id
             FROM Staff__c
             LIMIT 1];

        Participant_Docs_Share__c share =
            new Participant_Docs_Share__c(
                Attachment__c = att.Id,
                Staff__c = st.Id
            );

        insert share;

        Test.startTest();

        ClientAttachmentHandler.archiveAttachment(
            att.Id
        );

        ClientAttachmentHandler.restoreAttachment(
            att.Id
        );

        Test.stopTest();
    }
    
    
}
    @isTest
static void test_getFolders_staffFlow() {

    User u = [
        SELECT Id, Email
        FROM User
        WHERE Email =
            'manualtesting.209721@hotmail.com'
        LIMIT 1
    ];

    Staff__c st = [
        SELECT Id
        FROM Staff__c
        LIMIT 1
    ];

    st.Email_Address__c = u.Email;
    st.Status__c = true;
    update st;

    Client__c cli = [
        SELECT Id
        FROM Client__c
        LIMIT 1
    ];

    System.runAs(u) {

        // CREATE FOLDER
        Attachment_Folder__c folder =
            new Attachment_Folder__c(
                Participant__c = cli.Id,
                Name = 'Secure Folder'
            );

        insert folder;

        // SHARE FOLDER
        Folder_Share__c fs =
            new Folder_Share__c(
                Attachment_Folder__c = folder.Id,
                Staff__c = st.Id,
                Active__c = true,
                Full_Folder_Access__c = true
            );

        insert fs;

        Test.startTest();

        List<Attachment_Folder__c> result =
            ClientAttachmentHandler.getFolders(
                cli.Id
            );

        Test.stopTest();

         
    }
}
}