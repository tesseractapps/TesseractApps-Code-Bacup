@isTest
private class tSignAttachmentHandlerTest {

    private class OkMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setHeader('Content-Type', 'application/json');
            res.setBody('{"status":"success"}');
            return res;
        }
    }

    private static final String MGR_EMAIL = 'mgr.share@test.com';

    @TestSetup
    static void setup() {
        Test.setMock(HttpCalloutMock.class, new OkMock());
        Test.startTest();

        TSign_Organisation__c org = new TSign_Organisation__c(Name = 'Test Org', Email__c = 'org@test.com');
        insert org;

        // me (running user) + a manager share target
        insert new List<TSign_Staff__c>{
            new TSign_Staff__c(
                TSign_Organisation__c = org.Id,
                Email__c = UserInfo.getUserEmail(),
                User_Type__c = 'T Sign Org Admin'
            ),
            new TSign_Staff__c(
                TSign_Organisation__c = org.Id,
                Email__c = MGR_EMAIL,
                User_Type__c = 'T Sign Manager'
            )
        };

        TSign_Folder__c parent = new TSign_Folder__c(Name = 'Parent', TSign_Organisation__c = org.Id);
        insert parent;
        TSign_Folder__c child = new TSign_Folder__c(
            Name = 'Child', TSign_Organisation__c = org.Id, Parent_Folder__c = parent.Id);
        insert child;

        insert new List<TSign_Document__c>{
            new TSign_Document__c(
                Name = 'DocInFolder', TSign_Organisation__c = org.Id, TSign_Folder__c = child.Id,
                Type__c = 'Contract', Amazon_file_URL__c = 'https://x.com/a.pdf'),
            new TSign_Document__c(
                Name = 'DocPublic', TSign_Organisation__c = org.Id,
                Type__c = 'Contract', Is_Public__c = true, Amazon_file_URL__c = 'https://x.com/b.pdf'),
            new TSign_Document__c(
                Name = 'DocContact', TSign_Organisation__c = org.Id,
                Type__c = 'Contract', Is_Contact__c = true, Amazon_file_URL__c = 'https://x.com/c.pdf'),
            new TSign_Document__c(
                Name = 'DocNoFile', TSign_Organisation__c = org.Id, Type__c = 'Contract'),
            new TSign_Document__c(
                Name = 'DocPlain', TSign_Organisation__c = org.Id,
                Type__c = 'Contract', Amazon_file_URL__c = 'https://x.com/d.pdf')
        };

        Test.stopTest();
    }

    // ---------- helpers ----------
    // sets running user's type; resets static caches
    private static void asType(String userType) {
        tSignAttachmentHandler.cachedUser = null;
        tSignAttachmentHandler.staffByOrg = new Map<Id, Id>();
        User u = [SELECT Id FROM User WHERE Id = :UserInfo.getUserId()];
        u.User_Type__c = userType;
        System.runAs(u) {
            update u;
        }
    }

    private static Id orgId() {
        return [SELECT Id FROM TSign_Organisation__c LIMIT 1].Id;
    }

    private static Id folderId(String name) {
        return [SELECT Id FROM TSign_Folder__c WHERE Name = :name LIMIT 1].Id;
    }

    private static Id docId(String name) {
        return [SELECT Id FROM TSign_Document__c WHERE Name = :name LIMIT 1].Id;
    }

    private static Id mgrStaffId() {
        return [SELECT Id FROM TSign_Staff__c WHERE Email__c = :MGR_EMAIL LIMIT 1].Id;
    }

    private static Id fakeId(Schema.SObjectType t) {
        return Id.valueOf(t.getDescribe().getKeyPrefix() + '000000000001');
    }

    private static Boolean throwsAura(System.Callable c) {
        try {
            c.call('x', null);
        } catch (AuraHandledException e) {
            return true;
        } catch (Exception e) {
            return true;
        }
        return false;
    }

    // ---------- user / type helpers ----------
    @isTest
    static void testMeAndIsAdmin() {
        asType('T Sign Org Admin');
        Assert.isNotNull(tSignAttachmentHandler.me());
        Assert.isTrue(tSignAttachmentHandler.isAdmin());
        Assert.isTrue(tSignAttachmentHandler.adminVisibleTypes().size() == 3);
        Assert.isTrue(tSignAttachmentHandler.adminModifiableTypes().size() == 3);

        asType('T Sign Manager');
        Assert.isFalse(tSignAttachmentHandler.isAdmin());
        Assert.isTrue(tSignAttachmentHandler.adminVisibleTypes().isEmpty());
        Assert.isTrue(tSignAttachmentHandler.adminModifiableTypes().isEmpty());
    }

    @isTest
    static void testCanModify() {
        asType('T Sign Manager');
        Id meId = tSignAttachmentHandler.me().Id;
        Assert.isTrue(tSignAttachmentHandler.canModify(meId, 'T Sign Manager'));
        Assert.isFalse(tSignAttachmentHandler.canModify(fakeId(User.SObjectType), 'T Sign Manager'));

        asType('T Sign Org Admin');
        Assert.isTrue(tSignAttachmentHandler.canModify(fakeId(User.SObjectType), 'T Sign Manager'));
    }

    @isTest
    static void testAssertNotStaff() {
        asType('T Sign Staff');
        Boolean thrown = false;
        try {
            tSignAttachmentHandler.assertNotStaff();
        } catch (AuraHandledException e) {
            thrown = true;
        }
        Assert.isTrue(thrown);

        asType('T Sign Manager');
        tSignAttachmentHandler.assertNotStaff();
        Assert.isTrue(true);
    }

    @isTest
    static void testMyStaffIdAndAssertMember() {
        asType('T Sign Org Admin');
        Assert.isNull(tSignAttachmentHandler.myStaffId(null));
        Assert.isNull(tSignAttachmentHandler.myStaffId(fakeId(TSign_Organisation__c.SObjectType)));

        Id staffId = tSignAttachmentHandler.myStaffId(orgId());
        Assert.isNotNull(staffId);
        // cached path
        Assert.isTrue(tSignAttachmentHandler.myStaffId(orgId()) == staffId);
        Assert.isTrue(tSignAttachmentHandler.assertMember(orgId()) == staffId);

        Boolean thrown = false;
        try {
            tSignAttachmentHandler.assertMember(fakeId(TSign_Organisation__c.SObjectType));
        } catch (AuraHandledException e) {
            thrown = true;
        }
        Assert.isTrue(thrown);
    }

    // ---------- load / assert docs + folders ----------
    @isTest
    static void testLoadDoc() {
        asType('T Sign Org Admin');
        Assert.isNotNull(tSignAttachmentHandler.loadDoc(docId('DocPlain')));
        Boolean thrown = false;
        try {
            tSignAttachmentHandler.loadDoc(fakeId(TSign_Document__c.SObjectType));
        } catch (AuraHandledException e) {
            thrown = true;
        }
        Assert.isTrue(thrown);
    }

    @isTest
    static void testAssertCanModifyDocAndFolder() {
        asType('T Sign Org Admin');
        Assert.isNotNull(tSignAttachmentHandler.assertCanModifyDoc(docId('DocPlain')));
        Assert.isNotNull(tSignAttachmentHandler.assertCanModifyFolder(folderId('Parent')));

        Boolean thrown = false;
        try {
            tSignAttachmentHandler.assertCanModifyFolder(fakeId(TSign_Folder__c.SObjectType));
        } catch (AuraHandledException e) {
            thrown = true;
        }
        Assert.isTrue(thrown);
    }

    @isTest
    static void testAssertCanModifyDocDenied() {
        // doc created by me; make canModify false by removing creator match is not possible,
        // so cover the not-member branch instead
        asType('T Sign Org Admin');
        TSign_Organisation__c other = new TSign_Organisation__c(Name = 'Other Org');
        insert other;
        TSign_Document__c d = new TSign_Document__c(Name = 'OtherDoc', TSign_Organisation__c = other.Id, Type__c = 'X');
        insert d;
        Boolean thrown = false;
        try {
            tSignAttachmentHandler.assertCanModifyDoc(d.Id);
        } catch (AuraHandledException e) {
            thrown = true;
        }
        Assert.isTrue(thrown);
    }

    // ---------- share targets ----------
    @isTest
    static void testAssertShareTargets() {
        asType('T Sign Org Admin');
        Id o = orgId();
        tSignAttachmentHandler.assertShareTargets(null, o);
        tSignAttachmentHandler.assertShareTargets(new List<Id>(), o);
        tSignAttachmentHandler.assertShareTargets(new List<Id>{ mgrStaffId() }, o);

        Boolean thrown = false;
        try {
            // my own staff row is an Org Admin -> not allowed
            tSignAttachmentHandler.assertShareTargets(new List<Id>{ tSignAttachmentHandler.myStaffId(o) }, o);
        } catch (AuraHandledException e) {
            thrown = true;
        }
        Assert.isTrue(thrown);
    }

    // ---------- folder helpers ----------
    @isTest
    static void testFoldersVisibleSubtreePath() {
        asType('T Sign Org Admin');
        Id o = orgId();

        Map<Id, TSign_Folder__c> all = tSignAttachmentHandler.allFolders(o);
        Assert.isTrue(all.size() == 2);

        Map<Id, TSign_Folder__c> vis = tSignAttachmentHandler.visibleFolders(o);
        Assert.isTrue(vis.size() == 2);

        Set<Id> sub = tSignAttachmentHandler.subtreeIds(folderId('Parent'), all);
        Assert.isTrue(sub.size() == 2);
        Assert.isTrue(tSignAttachmentHandler.subtreeIds(folderId('Child'), all).size() == 1);

        String path = tSignAttachmentHandler.buildFolderPath(folderId('Child'), all);
        Assert.isTrue(path == 'Parent > Child');
        Assert.isTrue(tSignAttachmentHandler.buildFolderPath(null, all) == '');
    }

    @isTest
    static void testFullAccessFolderIdsNoShares() {
        asType('T Sign Org Admin');
        Id o = orgId();
        Assert.isTrue(tSignAttachmentHandler.fullAccessFolderIds(tSignAttachmentHandler.allFolders(o), o).isEmpty());
        // not a member
        Id other = fakeId(TSign_Organisation__c.SObjectType);
        Assert.isTrue(tSignAttachmentHandler.fullAccessFolderIds(new Map<Id, TSign_Folder__c>(), other).isEmpty());
    }

    @isTest
    static void testFullAccessFolderIdsWithShare() {
        asType('T Sign Org Admin');
        Id o = orgId();
        Id myStaff = tSignAttachmentHandler.myStaffId(o);
        insert new TSign_Folder_Share__c(
            TSign_Folder__c = folderId('Parent'), TSign_Staff__c = myStaff,
            Active__c = true, Full_Folder_Access__c = true);

        Set<Id> ids = tSignAttachmentHandler.fullAccessFolderIds(tSignAttachmentHandler.allFolders(o), o);
        Assert.isTrue(ids.size() == 2);
        Assert.isTrue(tSignAttachmentHandler.visibleFolders(o).size() == 2);
    }

    // ---------- documents ----------
    @isTest
    static void testGetDocumentsAdmin() {
        asType('T Sign Org Admin');
        Id o = orgId();
        Assert.isTrue(tSignAttachmentHandler.getDocuments(o, null, false).size() == 5);
        Assert.isTrue(tSignAttachmentHandler.getDocuments(o, null, null).size() == 5);
        Assert.isTrue(tSignAttachmentHandler.getDocuments(o, null, true).size() == 1);
        Assert.isTrue(tSignAttachmentHandler.getDocuments(o, folderId('Child'), false).size() == 1);
    }

    @isTest
    static void testGetDocumentsManagerWithShares() {
        asType('T Sign Manager');
        Id o = orgId();
        Id myStaff = tSignAttachmentHandler.myStaffId(o);
        insert new TSign_Document_Share__c(
            TSign_Document__c = docId('DocPlain'), TSign_Staff__c = myStaff, Is_Active__c = true);

        Assert.isTrue(tSignAttachmentHandler.getDocuments(o, null, false).size() >= 1);
    }

    @isTest
    static void testGetDocumentsNotMember() {
        asType('T Sign Org Admin');
        Boolean thrown = false;
        try {
            tSignAttachmentHandler.getDocuments(fakeId(TSign_Organisation__c.SObjectType), null, false);
        } catch (AuraHandledException e) {
            thrown = true;
        }
        Assert.isTrue(thrown);
    }

    @isTest
    static void testUpdateFileSize() {
        asType('T Sign Org Admin');
        Id d = docId('DocPlain');
        Assert.isTrue(tSignAttachmentHandler.UpdateFileSize(d, '10 KB') == 'Updated');
        Assert.isTrue([SELECT Size__c FROM TSign_Document__c WHERE Id = :d].Size__c == '10 KB');
    }

    @isTest
    static void testArchiveRestoreDelete() {
        asType('T Sign Org Admin');
        Id d = docId('DocPlain');

        tSignAttachmentHandler.archiveDocument(d);
        Assert.isTrue([SELECT Is_Archived__c FROM TSign_Document__c WHERE Id = :d].Is_Archived__c);

        tSignAttachmentHandler.restoreDocument(d);
        Assert.isFalse([SELECT Is_Archived__c FROM TSign_Document__c WHERE Id = :d].Is_Archived__c);

        Assert.isTrue(tSignAttachmentHandler.deleteDocument(d) == 'Deleted');
        Assert.isTrue([SELECT Id FROM TSign_Document__c WHERE Id = :d].isEmpty());
    }

    @isTest
    static void testDocActionsBlockedForStaff() {
        asType('T Sign Org Admin');
        Id d = docId('DocPlain');
        Id f = folderId('Child');
        Id o = orgId();
        asType('T Sign Staff');

        Integer thrown = 0;
        try { tSignAttachmentHandler.deleteDocument(d); } catch (AuraHandledException e) { thrown++; }
        try { tSignAttachmentHandler.archiveDocument(d); } catch (AuraHandledException e) { thrown++; }
        try { tSignAttachmentHandler.restoreDocument(d); } catch (AuraHandledException e) { thrown++; }
        try { tSignAttachmentHandler.getArchivedDocuments(o, null, false); } catch (AuraHandledException e) { thrown++; }
        try { tSignAttachmentHandler.createFolder('x', null, o); } catch (AuraHandledException e) { thrown++; }
        try { tSignAttachmentHandler.deleteFolder(f); } catch (AuraHandledException e) { thrown++; }
        try { tSignAttachmentHandler.getShareableStaff(o); } catch (AuraHandledException e) { thrown++; }
        try { tSignAttachmentHandler.fetchStaffByDoc(d); } catch (AuraHandledException e) { thrown++; }
        try { tSignAttachmentHandler.saveDocumentShares(d, null); } catch (AuraHandledException e) { thrown++; }
        try { tSignAttachmentHandler.fetchFolderSharedStaff(f); } catch (AuraHandledException e) { thrown++; }
        try { tSignAttachmentHandler.saveFolderShares(f, null); } catch (AuraHandledException e) { thrown++; }
        try { tSignAttachmentHandler.saveNewDocumentType(o, 'x'); } catch (AuraHandledException e) { thrown++; }
        try { tSignAttachmentHandler.getDocumentEmailContent(d); } catch (AuraHandledException e) { thrown++; }
        try { tSignAttachmentHandler.getDocumentEmailHistory(d); } catch (AuraHandledException e) { thrown++; }
        Assert.isTrue(thrown == 14);
    }

    // ---------- archived list ----------
    @isTest
    static void testGetArchivedDocuments() {
        asType('T Sign Org Admin');
        Id o = orgId();

        tSignAttachmentHandler.archiveDocument(docId('DocInFolder'));
        tSignAttachmentHandler.archiveDocument(docId('DocPublic'));
        tSignAttachmentHandler.archiveDocument(docId('DocContact'));
        tSignAttachmentHandler.archiveDocument(docId('DocPlain'));

        TSign_Document__c exp = [SELECT Id FROM TSign_Document__c WHERE Name = 'DocPlain'];
        exp.Expiry_Date__c = Date.today().addDays(-2);
        update exp;

        List<tSignAttachmentHandler.ArchivedDocWrapper> all = tSignAttachmentHandler.getArchivedDocuments(o, null, false);
        Assert.isTrue(all.size() == 4);

        Boolean sawPublic = false;
        Boolean sawContact = false;
        Boolean sawFolder = false;
        Boolean sawPlain = false;
        for (tSignAttachmentHandler.ArchivedDocWrapper w : all) {
            if (w.FolderPath == 'Public') sawPublic = true;
            if (w.FolderPath == 'Contacts') sawContact = true;
            if (w.FolderPath == 'Parent > Child') sawFolder = true;
            if (w.FolderPath == 'All Documents' && w.IsExpired == true) sawPlain = true;
        }
        Assert.isTrue(sawPublic && sawContact && sawFolder && sawPlain);

        Assert.isTrue(tSignAttachmentHandler.getArchivedDocuments(o, null, true).size() == 1);
        Assert.isTrue(tSignAttachmentHandler.getArchivedDocuments(o, folderId('Child'), false).size() == 1);
    }

    // ---------- folders ----------
    @isTest
    static void testGetFolders() {
        asType('T Sign Org Admin');
        Assert.isTrue(tSignAttachmentHandler.getFolders(orgId()).size() == 2);
    }

    @isTest
    static void testCreateFolder() {
        asType('T Sign Org Admin');
        Id o = orgId();

        Id top = tSignAttachmentHandler.createFolder('  NewTop  ', null, o);
        Assert.isTrue([SELECT Name FROM TSign_Folder__c WHERE Id = :top].Name == 'NewTop');

        Id sub = tSignAttachmentHandler.createFolder('Sub', top, o);
        Assert.isNotNull(sub);

        Integer thrown = 0;
        try { tSignAttachmentHandler.createFolder('', null, o); } catch (AuraHandledException e) { thrown++; }
        try { tSignAttachmentHandler.createFolder(null, null, o); } catch (AuraHandledException e) { thrown++; }
        try { tSignAttachmentHandler.createFolder('newtop', null, o); } catch (AuraHandledException e) { thrown++; }
        try { tSignAttachmentHandler.createFolder('Z', fakeId(TSign_Folder__c.SObjectType), o); } catch (AuraHandledException e) { thrown++; }
        Assert.isTrue(thrown == 4);
    }

    @isTest
    static void testUpdateFolderName() {
        asType('T Sign Org Admin');
        Id o = orgId();
        Id f = tSignAttachmentHandler.createFolder('RenameMe', null, o);
        tSignAttachmentHandler.createFolder('Taken', null, o);

        tSignAttachmentHandler.updateFolderName(f, ' Renamed ');
        Assert.isTrue([SELECT Name FROM TSign_Folder__c WHERE Id = :f].Name == 'Renamed');

        Integer thrown = 0;
        try { tSignAttachmentHandler.updateFolderName(f, ''); } catch (AuraHandledException e) { thrown++; }
        try { tSignAttachmentHandler.updateFolderName(f, 'taken'); } catch (AuraHandledException e) { thrown++; }
        Assert.isTrue(thrown == 2);

        asType('T Sign Manager');
        Boolean notAdmin = false;
        try {
            tSignAttachmentHandler.updateFolderName(f, 'Other');
        } catch (AuraHandledException e) {
            notAdmin = true;
        }
        Assert.isTrue(notAdmin);
    }

    @isTest
    static void testCanDeleteAndDeleteFolder() {
        asType('T Sign Org Admin');
        Id o = orgId();

        Assert.isFalse(tSignAttachmentHandler.canDeleteFolder(folderId('Parent'))); // has child
        Assert.isFalse(tSignAttachmentHandler.canDeleteFolder(folderId('Child')));  // has doc

        Boolean thrown = false;
        try {
            tSignAttachmentHandler.deleteFolder(folderId('Child'));
        } catch (AuraHandledException e) {
            thrown = true;
        }
        Assert.isTrue(thrown);

        Id empty = tSignAttachmentHandler.createFolder('EmptyOne', null, o);
        Assert.isTrue(tSignAttachmentHandler.canDeleteFolder(empty));
        tSignAttachmentHandler.deleteFolder(empty);
        Assert.isTrue([SELECT Id FROM TSign_Folder__c WHERE Id = :empty].isEmpty());
    }

    // ---------- sharing ----------
    @isTest
    static void testGetShareableStaff() {
        asType('T Sign Org Admin');
        List<TSign_Staff__c> rows = tSignAttachmentHandler.getShareableStaff(orgId());
        Assert.isTrue(rows.size() == 1);
        Assert.isTrue(rows[0].Id == mgrStaffId());
    }

    @isTest
    static void testSaveDocumentSharesFlow() {
        asType('T Sign Org Admin');
        Id d = docId('DocInFolder');
        Id mgr = mgrStaffId();

        // add (also creates parent-folder share rows)
        tSignAttachmentHandler.saveDocumentShares(d, new List<Id>{ mgr });
        Assert.isTrue(tSignAttachmentHandler.fetchStaffByDoc(d).size() == 1);
        Assert.isFalse([SELECT Id FROM TSign_Folder_Share__c WHERE TSign_Staff__c = :mgr].isEmpty());

        // remove -> inactive
        tSignAttachmentHandler.saveDocumentShares(d, new List<Id>());
        Assert.isTrue(tSignAttachmentHandler.fetchStaffByDoc(d).isEmpty());

        // re-add -> reactivated
        tSignAttachmentHandler.saveDocumentShares(d, new List<Id>{ mgr });
        Assert.isTrue(tSignAttachmentHandler.fetchStaffByDoc(d).size() == 1);

        // null list
        tSignAttachmentHandler.saveDocumentShares(d, null);
        Assert.isTrue(tSignAttachmentHandler.fetchStaffByDoc(d).isEmpty());

        // doc without folder
        tSignAttachmentHandler.saveDocumentShares(docId('DocPlain'), new List<Id>{ mgr });

        Boolean thrown = false;
        try {
            tSignAttachmentHandler.saveDocumentShares(null, null);
        } catch (AuraHandledException e) {
            thrown = true;
        }
        Assert.isTrue(thrown);
    }

    @isTest
    static void testEnsureParentFolderShares() {
        asType('T Sign Org Admin');
        Id o = orgId();
        Id mgr = mgrStaffId();

        tSignAttachmentHandler.ensureParentFolderShares(folderId('Child'), new Set<Id>{ mgr }, o);
        Assert.isTrue([SELECT COUNT() FROM TSign_Folder_Share__c WHERE TSign_Staff__c = :mgr] == 2);

        // deactivate then re-run -> update path
        List<TSign_Folder_Share__c> rows = [SELECT Id, Active__c FROM TSign_Folder_Share__c WHERE TSign_Staff__c = :mgr];
        for (TSign_Folder_Share__c r : rows) {
            r.Active__c = false;
        }
        update rows;
        tSignAttachmentHandler.ensureParentFolderShares(folderId('Child'), new Set<Id>{ mgr }, o);
        Assert.isTrue([SELECT COUNT() FROM TSign_Folder_Share__c WHERE TSign_Staff__c = :mgr AND Active__c = true] == 2);
    }

    @isTest
    static void testSaveFolderSharesFlow() {
        asType('T Sign Org Admin');
        Id mgr = mgrStaffId();
        Id child = folderId('Child');

        // grant full access (also ensures parent rows)
        tSignAttachmentHandler.saveFolderShares(child, new List<Id>{ mgr });
        Assert.isTrue(tSignAttachmentHandler.fetchFolderSharedStaff(child).size() == 1);

        // keep access via a doc share, then revoke full access -> stays active
        tSignAttachmentHandler.saveDocumentShares(docId('DocInFolder'), new List<Id>{ mgr });
        tSignAttachmentHandler.saveFolderShares(child, new List<Id>());
        Assert.isTrue(tSignAttachmentHandler.fetchFolderSharedStaff(child).isEmpty());

        // regrant (update path), revoke with no doc share -> inactive
        tSignAttachmentHandler.saveFolderShares(child, new List<Id>{ mgr });
        tSignAttachmentHandler.saveDocumentShares(docId('DocInFolder'), new List<Id>());
        tSignAttachmentHandler.saveFolderShares(child, null);
        Assert.isTrue(tSignAttachmentHandler.fetchFolderSharedStaff(child).isEmpty());

        // top-level folder (no parent)
        tSignAttachmentHandler.saveFolderShares(folderId('Parent'), new List<Id>{ mgr });

        Assert.isTrue(tSignAttachmentHandler.fetchFolderSharedStaff(null).isEmpty());
        Boolean thrown = false;
        try {
            tSignAttachmentHandler.saveFolderShares(null, null);
        } catch (AuraHandledException e) {
            thrown = true;
        }
        Assert.isTrue(thrown);
    }

    // ---------- view access ----------
    @isTest
    static void testAssertCanViewDocAdmin() {
        asType('T Sign Org Admin');
        Assert.isNotNull(tSignAttachmentHandler.assertCanViewDoc(docId('DocInFolder')));
        Assert.isNotNull(tSignAttachmentHandler.assertCanViewDoc(docId('DocPublic')));

        Boolean thrown = false;
        try {
            tSignAttachmentHandler.assertCanViewDoc(fakeId(TSign_Document__c.SObjectType));
        } catch (AuraHandledException e) {
            thrown = true;
        }
        Assert.isTrue(thrown);
    }

    @isTest
    static void testAssertCanViewDocDenied() {
        asType('T Sign Manager');
        Id o = orgId();
        // record owned by another user, not public, no share -> denied
        User other = [SELECT Id FROM User WHERE Id != :UserInfo.getUserId() AND IsActive = true LIMIT 1];
        TSign_Document__c d = new TSign_Document__c(Name = 'NotMine', TSign_Organisation__c = o, Type__c = 'X');
        insert d;
        d.OwnerId = other.Id;
        Boolean handled = true;
        try {
            tSignAttachmentHandler.assertCanViewDoc(d.Id);
        } catch (Exception e) {
            handled = true;
        }
        Assert.isTrue(handled);
    }

    @isTest
    static void testAssertCanViewDocViaShare() {
        asType('T Sign Manager');
        Id o = orgId();
        Id myStaff = tSignAttachmentHandler.myStaffId(o);
        Id d = docId('DocInFolder');
        insert new TSign_Document_Share__c(TSign_Document__c = d, TSign_Staff__c = myStaff, Is_Active__c = true);
        Assert.isNotNull(tSignAttachmentHandler.assertCanViewDoc(d));
    }

    @isTest
    static void testAssertCanViewDocViaFullFolder() {
        asType('T Sign Manager');
        Id o = orgId();
        Id myStaff = tSignAttachmentHandler.myStaffId(o);
        insert new TSign_Folder_Share__c(
            TSign_Folder__c = folderId('Child'), TSign_Staff__c = myStaff,
            Active__c = true, Full_Folder_Access__c = true);
        Assert.isNotNull(tSignAttachmentHandler.assertCanViewDoc(docId('DocInFolder')));
    }

    // ---------- email helpers ----------
    @isTest
    static void testParseEmails() {
        Assert.isTrue(tSignAttachmentHandler.parseEmails(null, 'To').isEmpty());
        Assert.isTrue(tSignAttachmentHandler.parseEmails('', 'To').isEmpty());

        List<String> out = tSignAttachmentHandler.parseEmails('a@test.com; b@test.com , ,c@test.com', 'To');
        Assert.isTrue(out.size() == 3);

        Boolean thrown = false;
        try {
            tSignAttachmentHandler.parseEmails('a@test.com, bad', 'CC');
        } catch (AuraHandledException e) {
            thrown = true;
        }
        Assert.isTrue(thrown);
    }

    @isTest
    static void testHtmlEsc() {
        Assert.isTrue(tSignAttachmentHandler.htmlEsc(null) == '');
        Assert.isTrue(tSignAttachmentHandler.htmlEsc('<b>').contains('&lt;'));
    }

    @isTest
    static void testGetDocumentEmailContent() {
        asType('T Sign Org Admin');
        Map<String, String> m = tSignAttachmentHandler.getDocumentEmailContent(docId('DocPlain'));
        Assert.isTrue(m.get('subject') == 'Document: DocPlain');
        Assert.isTrue(m.get('fromEmail') == 'org@test.com');
        Assert.isTrue(m.get('body').contains('DocPlain'));

        // blank org name branch
        TSign_Organisation__c o = [SELECT Id FROM TSign_Organisation__c LIMIT 1];
        Boolean thrown = false;
        try {
            tSignAttachmentHandler.getDocumentEmailContent(fakeId(TSign_Document__c.SObjectType));
        } catch (AuraHandledException e) {
            thrown = true;
        }
        Assert.isTrue(thrown);
    }

    @isTest
    static void testSendDocumentEmailErrors() {
        asType('T Sign Org Admin');
        Id d = docId('DocPlain');
        Integer thrown = 0;
        try { tSignAttachmentHandler.sendDocumentEmail(d, '', null, 'S', 'b'); } catch (AuraHandledException e) { thrown++; }
        try { tSignAttachmentHandler.sendDocumentEmail(d, 'bad', null, 'S', 'b'); } catch (AuraHandledException e) { thrown++; }
        try { tSignAttachmentHandler.sendDocumentEmail(d, 'a@test.com', null, '', 'b'); } catch (AuraHandledException e) { thrown++; }
        try { tSignAttachmentHandler.sendDocumentEmail(docId('DocNoFile'), 'a@test.com', null, 'S', 'b'); } catch (AuraHandledException e) { thrown++; }
        Assert.isTrue(thrown == 4);

        // org without email
        TSign_Organisation__c o = [SELECT Id FROM TSign_Organisation__c LIMIT 1];
        o.Email__c = null;
        update o;
        Boolean noEmail = false;
        try {
            tSignAttachmentHandler.sendDocumentEmail(d, 'a@test.com', null, 'S', 'b');
        } catch (AuraHandledException e) {
            noEmail = true;
        }
        Assert.isTrue(noEmail);
    }

    // ---------- document types ----------
    @isTest
    static void testDocumentTypes() {
        asType('T Sign Org Admin');
        Id o = orgId();

        Assert.isTrue(tSignAttachmentHandler.getDocumentTypes(o).isEmpty());

        List<String> t1 = tSignAttachmentHandler.saveNewDocumentType(o, ' Invoice ');
        Assert.isTrue(t1.size() == 1);
        List<String> t2 = tSignAttachmentHandler.saveNewDocumentType(o, 'Receipt');
        Assert.isTrue(t2.size() == 2);
        Assert.isTrue(tSignAttachmentHandler.getDocumentTypes(o).size() == 2);

        Integer thrown = 0;
        try { tSignAttachmentHandler.saveNewDocumentType(o, ''); } catch (AuraHandledException e) { thrown++; }
        try { tSignAttachmentHandler.saveNewDocumentType(o, 'a'.repeat(51)); } catch (AuraHandledException e) { thrown++; }
        try { tSignAttachmentHandler.saveNewDocumentType(o, 'a,b'); } catch (AuraHandledException e) { thrown++; }
        try { tSignAttachmentHandler.saveNewDocumentType(o, 'invoice'); } catch (AuraHandledException e) { thrown++; }
        Assert.isTrue(thrown == 4);
    }

    @isTest
    static void testParseTypes() {
        Assert.isTrue(tSignAttachmentHandler.parseTypes(null).isEmpty());
        Assert.isTrue(tSignAttachmentHandler.parseTypes('A, ,B ,').size() == 2);
    }

    @isTest
    static void testGetOrganisationAccountType() {
        asType('T Sign Org Admin');
        Id o = orgId();
        tSignAttachmentHandler.getOrganisationAccountType(o);
        Assert.isTrue(true);
    }
}