public class tSignAttachmentHandler {

    public static final String ORG_ADMIN = 'T Sign Org Admin';
    public static final String MANAGER   = 'T Sign Manager';
    public static final String STAFF     = 'T Sign Staff';

    // who can receive shares. Add STAFF here if staff must be share targets.
    public static final Set<String> SHARE_TARGET_TYPES = new Set<String>{ MANAGER };

    public static User cachedUser;
    public static Map<Id, Id> staffByOrg = new Map<Id, Id>();

    // =====================================================================
    // HELPERS
    // =====================================================================

    // current user. Email is needed to map User -> TSign_Staff__c
    public static User me() {
        if (cachedUser == null) {
            cachedUser = [
                SELECT Id, Email, User_Type__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];
        }
        return cachedUser;
    }

    public static Boolean isAdmin() {
        return me().User_Type__c == ORG_ADMIN;
    }

    // my TSign_Staff__c in this org, matched by EMAIL
    // (User.Email == TSign_Staff__c.Email__c). null if not a member.
    public static Id myStaffId(Id orgId) {
        if (orgId == null) {
            return null;
        }
        if (!staffByOrg.containsKey(orgId)) {
            String myEmail = me().Email;
            Id found = null;

            if (String.isNotBlank(myEmail)) {
                List<TSign_Staff__c> staffRows = [
                    SELECT Id
                    FROM TSign_Staff__c
                    WHERE Email__c = :myEmail
                    AND TSign_Organisation__c = :orgId
                    // AND Status__c = true
                    ORDER BY CreatedDate ASC
                    LIMIT 1
                ];
                if (!staffRows.isEmpty()) {
                    found = staffRows[0].Id;
                }
            }
            staffByOrg.put(orgId, found);
        }
        return staffByOrg.get(orgId);
    }

    // throw if I am not in the org. returns my staff id.
    public static Id assertMember(Id orgId) {
        Id staffId = myStaffId(orgId);
        if (staffId == null) {
            throw new AuraHandledException('You do not belong to this organisation.');
        }
        return staffId;
    }

    // creator types an Org Admin can SEE
    public static List<String> adminVisibleTypes() {
        return isAdmin()
            ? new List<String>{ MANAGER, ORG_ADMIN, STAFF }
            : new List<String>();
    }

    // creator types an Org Admin can MODIFY (not other admins)
    public static List<String> adminModifiableTypes() {
        return isAdmin()
            ? new List<String>{ MANAGER, ORG_ADMIN, STAFF }
            : new List<String>();
    }

    public static Boolean canModify(Id creatorId, String creatorType) {
        if (creatorId == me().Id) {
            return true;
        }
        return isAdmin();
    }

    public static void assertNotStaff() {
        if (me().User_Type__c == STAFF) {
            throw new AuraHandledException('You do not have permission for this action.');
        }
    }

    public static TSign_Document__c loadDoc(Id docId) {
        List<TSign_Document__c> docs = [
            SELECT Id, TSign_Folder__c, TSign_Organisation__c, CreatedById, CreatedBy.User_Type__c
            FROM TSign_Document__c
            WHERE Id = :docId
            LIMIT 1
        ];
        if (docs.isEmpty()) {
            throw new AuraHandledException('Document not found.');
        }
        return docs[0];
    }

    public static TSign_Document__c assertCanModifyDoc(Id docId) {
        TSign_Document__c d = loadDoc(docId);
        assertMember(d.TSign_Organisation__c);
        if (!canModify(d.CreatedById, d.CreatedBy.User_Type__c)) {
            throw new AuraHandledException('You do not have permission to change this document.');
        }
        return d;
    }

    public static TSign_Folder__c assertCanModifyFolder(Id folderId) {
        List<TSign_Folder__c> fl = [
            SELECT Id, Parent_Folder__c, TSign_Organisation__c, CreatedById, CreatedBy.User_Type__c
            FROM TSign_Folder__c
            WHERE Id = :folderId
            LIMIT 1
        ];
        if (fl.isEmpty()) {
            throw new AuraHandledException('Folder not found.');
        }
        assertMember(fl[0].TSign_Organisation__c);
        if (!canModify(fl[0].CreatedById, fl[0].CreatedBy.User_Type__c)) {
            throw new AuraHandledException('You do not have permission to change this folder.');
        }
        return fl[0];
    }

    // targets must be allowed type AND in the same org
    public static void assertShareTargets(List<Id> staffIds, Id orgId) {
        if (staffIds == null || staffIds.isEmpty()) {
            return;
        }
        Set<Id> unique = new Set<Id>(staffIds);
        Integer ok = [
            SELECT COUNT()
            FROM TSign_Staff__c
            WHERE Id IN :unique
            AND TSign_Organisation__c = :orgId
            AND User_Type__c IN :SHARE_TARGET_TYPES
            // AND Status__c = true
        ];
        if (ok != unique.size()) {
            throw new AuraHandledException('Access can only be granted to ' +
                String.join(new List<String>(SHARE_TARGET_TYPES), ', ') +
                ' of this organisation.');
        }
    }

    public static Map<Id, TSign_Folder__c> allFolders(Id orgId) {
        return new Map<Id, TSign_Folder__c>([
            SELECT Id, Name, Parent_Folder__c, CreatedById, CreatedBy.User_Type__c
            FROM TSign_Folder__c
            WHERE TSign_Organisation__c = :orgId
        ]);
    }

    // folders I can see: mine, (Org Admin) Manager + Admin folders,
    // folders shared to me (incl. parent-only rows), descendants of full-access shares
    public static Map<Id, TSign_Folder__c> visibleFolders(Id orgId) {
        Id staffId = assertMember(orgId);
        Id meId = me().Id;
        List<String> adminTypes = adminVisibleTypes();

        Map<Id, TSign_Folder__c> all = allFolders(orgId);
        Set<Id> visible = new Set<Id>();

        for (TSign_Folder__c f : all.values()) {
            if (f.CreatedById == meId || adminTypes.contains(f.CreatedBy.User_Type__c)) {
                visible.add(f.Id);
            }
        }

        List<TSign_Folder_Share__c> shareRows = [
            SELECT TSign_Folder__c
            FROM TSign_Folder_Share__c
            WHERE TSign_Staff__c = :staffId
            AND Active__c = true
        ];
        for (TSign_Folder_Share__c fs : shareRows) {
            if (all.containsKey(fs.TSign_Folder__c)) {
                visible.add(fs.TSign_Folder__c);
            }
        }

        for (Id fid : fullAccessFolderIds(all, orgId)) {
            if (all.containsKey(fid)) {
                visible.add(fid);
            }
        }

        Map<Id, TSign_Folder__c> result = new Map<Id, TSign_Folder__c>();
        for (Id fid : visible) {
            result.put(fid, all.get(fid));
        }
        return result;
    }

    // folder + all its descendants
    public static Set<Id> subtreeIds(Id rootId, Map<Id, TSign_Folder__c> folderMap) {
        Map<Id, List<Id>> childrenMap = new Map<Id, List<Id>>();
        for (TSign_Folder__c f : folderMap.values()) {
            if (f.Parent_Folder__c != null) {
                if (!childrenMap.containsKey(f.Parent_Folder__c)) {
                    childrenMap.put(f.Parent_Folder__c, new List<Id>());
                }
                childrenMap.get(f.Parent_Folder__c).add(f.Id);
            }
        }
        Set<Id> result = new Set<Id>();
        List<Id> queue = new List<Id>{ rootId };
        while (!queue.isEmpty()) {
            Id cur = queue.remove(0);
            if (result.add(cur) && childrenMap.containsKey(cur)) {
                queue.addAll(childrenMap.get(cur));
            }
        }
        return result;
    }

    // ids of folders shared to me with full access + all their descendants
    public static Set<Id> fullAccessFolderIds(Map<Id, TSign_Folder__c> folderMap, Id orgId) {
        Set<Id> result = new Set<Id>();
        Id staffId = myStaffId(orgId);
        if (staffId == null) {
            return result;
        }

        // query into a list first, then loop (no inline SOQL for-loop)
        List<TSign_Folder_Share__c> shareRows = [
            SELECT TSign_Folder__c
            FROM TSign_Folder_Share__c
            WHERE TSign_Staff__c = :staffId
            AND Active__c = true
            AND Full_Folder_Access__c = true
        ];

        Set<Id> roots = new Set<Id>();
        for (TSign_Folder_Share__c fs : shareRows) {
            roots.add(fs.TSign_Folder__c);
        }
        if (roots.isEmpty()) {
            return result;
        }

        Map<Id, List<Id>> childrenMap = new Map<Id, List<Id>>();
        for (TSign_Folder__c f : folderMap.values()) {
            if (f.Parent_Folder__c != null) {
                if (!childrenMap.containsKey(f.Parent_Folder__c)) {
                    childrenMap.put(f.Parent_Folder__c, new List<Id>());
                }
                childrenMap.get(f.Parent_Folder__c).add(f.Id);
            }
        }

        List<Id> queue = new List<Id>(roots);
        while (!queue.isEmpty()) {
            Id curId = queue.remove(0);
            if (result.add(curId) && childrenMap.containsKey(curId)) {
                queue.addAll(childrenMap.get(curId));
            }
        }
        return result;
    }

    public static String buildFolderPath(Id folderId, Map<Id, TSign_Folder__c> folderMap) {
        List<String> names = new List<String>();
        Integer guard = 0;

        // walk child → root, append (no add(0, x): throws ListException on empty list)
        while (folderId != null && folderMap.containsKey(folderId) && guard < 20) {
            TSign_Folder__c f = folderMap.get(folderId);
            names.add(f.Name);
            folderId = f.Parent_Folder__c;
            guard++;
        }

        // flip to root → child
        List<String> ordered = new List<String>();
        for (Integer i = names.size() - 1; i >= 0; i--) {
            ordered.add(names[i]);
        }
        return String.join(ordered, ' > ');
    }

    public static final String DOC_FIELDS =
        'Id, Name, Type__c, Comments__c, Size__c, Key__c, ' +
        'Amazon_file_URL__c, Expiry_Date__c, Date_Format__c, CreatedDate, CreatedById, ' +
        'CreatedBy.FirstName, CreatedBy.LastName, CreatedBy.Full_Name__c, CreatedBy.User_Type__c, ' +
        'TSign_Folder__c, TSign_Organisation__c, Is_Public__c, Is_Contact__c, ' +
        'LastModifiedBy.FirstName, LastModifiedBy.LastName, LastModifiedBy.Full_Name__c, LastModifiedDate';

    // =====================================================================
    // DOCUMENTS
    // =====================================================================

    @AuraEnabled
    public static List<TSign_Document__c> getDocuments(
        Id orgId,
        Id folderId,
        Boolean publicOnly
    ) {

        Id staffId = assertMember(orgId);
        Id meId = me().Id;
        List<String> adminTypes = adminVisibleTypes();

        // docs shared to me directly
        Set<Id> sharedDocIds = new Set<Id>();
        List<TSign_Document_Share__c> myShares = [
            SELECT TSign_Document__c
            FROM TSign_Document_Share__c
            WHERE TSign_Staff__c = :staffId
            AND Is_Active__c = true
        ];
        for (TSign_Document_Share__c s : myShares) {
            sharedDocIds.add(s.TSign_Document__c);
        }

        // docs inside folders shared to me with full access
        Set<Id> fullFolders = fullAccessFolderIds(allFolders(orgId), orgId);

        String q =
            'SELECT ' + DOC_FIELDS + ' FROM TSign_Document__c ' +
            'WHERE TSign_Organisation__c = :orgId ' +
            'AND Is_Archived__c = false ' +
            'AND (CreatedById = :meId ' +
            '  OR Is_Public__c = true ' +
            '  OR CreatedBy.User_Type__c IN :adminTypes ' +
            '  OR TSign_Folder__r.CreatedBy.User_Type__c IN :adminTypes ' +
            '  OR Id IN :sharedDocIds ' +
            '  OR TSign_Folder__c IN :fullFolders) ';

        if (publicOnly == true) {
            q += 'AND Is_Public__c = true ';
        } else if (folderId != null) {
            q += 'AND TSign_Folder__c = :folderId ';
        }

        q += 'ORDER BY CreatedDate DESC';
        return Database.query(q);
    }

    @AuraEnabled
    public static String UpdateFileSize(Id docId, String filesize) {
        assertCanModifyDoc(docId);
        update new TSign_Document__c(Id = docId, Size__c = filesize);
        return 'Updated';
    }

    @AuraEnabled
    public static String deleteDocument(Id docId) {
        assertNotStaff();
        assertCanModifyDoc(docId);

        delete [SELECT Id FROM TSign_Document_Share__c WHERE TSign_Document__c = :docId];
        delete [SELECT Id FROM TSign_Document__c WHERE Id = :docId];
        return 'Deleted';
    }

    @AuraEnabled
    public static void archiveDocument(Id docId) {
        assertNotStaff();
        assertCanModifyDoc(docId);

        update new TSign_Document__c(
            Id = docId,
            Is_Archived__c = true,
            Archived_Date__c = Date.today(),
            Archived_By__c = UserInfo.getUserId()
        );
    }

    @AuraEnabled
    public static void restoreDocument(Id docId) {
        assertNotStaff();
        assertCanModifyDoc(docId);

        update new TSign_Document__c(
            Id = docId,
            Is_Archived__c = false,
            Archived_Date__c = null,
            Archived_By__c = null
        );

        // same as old behaviour: restore clears doc shares
        delete [SELECT Id FROM TSign_Document_Share__c WHERE TSign_Document__c = :docId];
    }

    // =====================================================================
    // ARCHIVE
    // =====================================================================

    public class ArchivedDocWrapper {
        @AuraEnabled public Id Id;
        // @AuraEnabled public String DocumentUID;
        @AuraEnabled public String Name;
        @AuraEnabled public String Type;
        @AuraEnabled public String ArchivedDate;
        @AuraEnabled public Date ExpiryDate;
        @AuraEnabled public Boolean IsExpired;
        @AuraEnabled public String ArchivedBy;
        @AuraEnabled public String AmazonURL;
        @AuraEnabled public String Key;
        @AuraEnabled public String ParentFolder;
        @AuraEnabled public String FolderPath;
    }

    /**
     * Archived list = docs I can modify: own + (Org Admin) all Manager docs. Inside org.
     */
    @AuraEnabled
    public static List<ArchivedDocWrapper> getArchivedDocuments(
        Id orgId,
        Id folderId,
        Boolean publicOnly
    ) {
        assertNotStaff();
        assertMember(orgId);

        Id meId = me().Id;
        List<String> modTypes = adminModifiableTypes();

        String q =
            'SELECT Id, Name, Type__c, Date_Format__c, Expiry_Date__c, ' +
            'Archived_Date__c, Archived_By__r.Name, Amazon_file_URL__c, Key__c, ' +
            'TSign_Folder__c, Is_Public__c, Is_Contact__c, ' +
            'TSign_Folder__r.Name, TSign_Folder__r.Parent_Folder__r.Name ' +
            'FROM TSign_Document__c ' +
            'WHERE TSign_Organisation__c = :orgId ' +
            'AND Is_Archived__c = true ' +
            'AND (CreatedById = :meId OR CreatedBy.User_Type__c IN :modTypes) ';

        if (publicOnly == true) {
            q += 'AND Is_Public__c = true ';
        } else if (folderId != null) {
            q += 'AND TSign_Folder__c = :folderId ';
        }
        q += 'ORDER BY Archived_Date__c DESC';

        List<TSign_Document__c> docs = Database.query(q);
        Map<Id, TSign_Folder__c> folderMap = allFolders(orgId);

        List<ArchivedDocWrapper> results = new List<ArchivedDocWrapper>();

        for (TSign_Document__c d : docs) {
            ArchivedDocWrapper w = new ArchivedDocWrapper();
            w.Id = d.Id;
            // w.DocumentUID = d.Document_UID__c;
            w.Name = d.Name;
            w.Type = d.Type__c;
            w.ExpiryDate = d.Expiry_Date__c;
            w.IsExpired = d.Expiry_Date__c != null && d.Expiry_Date__c < Date.today();
            w.ArchivedDate = d.Date_Format__c;
            w.ArchivedBy = d.Archived_By__r != null ? d.Archived_By__r.Name : '';
            w.AmazonURL = d.Amazon_file_URL__c;
            w.Key = d.Key__c;

            if (d.Is_Public__c == true) {
                w.FolderPath = 'Public';
                w.ParentFolder = 'All Documents';
            } else if (d.Is_Contact__c == true) {
                w.FolderPath = 'Contacts';
                w.ParentFolder = 'All Documents';
            } else if (d.TSign_Folder__c != null) {
                w.FolderPath = buildFolderPath(d.TSign_Folder__c, folderMap);
                w.ParentFolder = d.TSign_Folder__r.Parent_Folder__r != null
                    ? d.TSign_Folder__r.Parent_Folder__r.Name
                    : '';
            } else {
                w.FolderPath = 'All Documents';
                w.ParentFolder = 'All Documents';
            }
            results.add(w);
        }
        return results;
    }

    // =====================================================================
    // FOLDERS
    // =====================================================================

    /**
     * Folders are saved with the organisation but visible user-wise:
     *  - Manager folder   -> that Manager + all Org Admins
     *  - Org Admin folder -> all Org Admins
     *  - shared folders   -> the staff they were shared with
     */
    @AuraEnabled
    public static List<TSign_Folder__c> getFolders(Id orgId) {
        Set<Id> ids = visibleFolders(orgId).keySet();
        return [
            SELECT Id, Name, Parent_Folder__c, CreatedById, CreatedBy.User_Type__c
            FROM TSign_Folder__c
            WHERE Id IN :ids
            ORDER BY Name
        ];
    }

    @AuraEnabled
    public static Id createFolder(String name, Id parentId, Id orgId) {
        assertNotStaff();
        assertMember(orgId);

        if (String.isBlank(name)) {
            throw new AuraHandledException('Folder name is required');
        }
        String trimmed = name.trim();

        Map<Id, TSign_Folder__c> visible = visibleFolders(orgId);

        // parent must be a folder I can see (same org)
        if (parentId != null && !visible.containsKey(parentId)) {
            throw new AuraHandledException('Parent folder not found.');
        }

        // duplicate check among the folders I can see
        for (TSign_Folder__c f : visible.values()) {
            if (f.Parent_Folder__c == parentId && f.Name.equalsIgnoreCase(trimmed)) {
                throw new AuraHandledException('A folder with this name already exists.');
            }
        }

        TSign_Folder__c folder = new TSign_Folder__c(
            Name = trimmed,
            Parent_Folder__c = parentId,
            TSign_Organisation__c = orgId
        );
        insert folder;
        return folder.Id;
    }

    @AuraEnabled
    public static void updateFolderName(Id folderId, String newName) {
        if (!isAdmin()) {
            throw new AuraHandledException('Only an Org Admin can edit folders.');
        }
        if (String.isBlank(newName)) {
            throw new AuraHandledException('Folder name cannot be empty');
        }
        String trimmed = newName.trim();
        TSign_Folder__c folder = assertCanModifyFolder(folderId);

        // duplicate check among sibling folders I can see
        for (TSign_Folder__c f : visibleFolders(folder.TSign_Organisation__c).values()) {
            if (f.Id != folderId
                && f.Parent_Folder__c == folder.Parent_Folder__c
                && f.Name.equalsIgnoreCase(trimmed)) {
                throw new AuraHandledException('A folder with this name already exists.');
            }
        }
        update new TSign_Folder__c(Id = folderId, Name = trimmed);
    }

    @AuraEnabled
    public static Boolean canDeleteFolder(Id folderId) {
        Integer childFolders = [
            SELECT COUNT() FROM TSign_Folder__c WHERE Parent_Folder__c = :folderId
        ];
        Integer files = [
            SELECT COUNT() FROM TSign_Document__c WHERE TSign_Folder__c = :folderId
        ];
        return childFolders == 0 && files == 0;
    }

    @AuraEnabled
    public static void deleteFolder(Id folderId) {
        assertNotStaff();
        assertCanModifyFolder(folderId);

        if (!canDeleteFolder(folderId)) {
            throw new AuraHandledException(
                'Folder cannot be deleted because it contains files or subfolders.'
            );
        }
        delete [SELECT Id FROM TSign_Folder_Share__c WHERE TSign_Folder__c = :folderId];
        delete [SELECT Id FROM TSign_Folder__c WHERE Id = :folderId];
    }

    // =====================================================================
    // SHARING
    // =====================================================================
    @AuraEnabled(cacheable=true)
    public static List<TSign_Staff__c> getShareableStaff(Id orgId) {
        assertNotStaff();
        assertMember(orgId);

        Id myId = myStaffId(orgId);
        String myEmail = me().Email;

        List<TSign_Staff__c> rows = [
            SELECT Id, Display_Nickname__c, Email__c, User_Type__c
            FROM TSign_Staff__c
            WHERE TSign_Organisation__c = :orgId
            // AND Status__c = true
            AND User_Type__c IN :SHARE_TARGET_TYPES
            ORDER BY Display_Nickname__c
        ];

        List<TSign_Staff__c> out = new List<TSign_Staff__c>();
        for (TSign_Staff__c s : rows) {
            if (s.Id == myId) {
                continue;
            }
            if (String.isNotBlank(myEmail) && String.isNotBlank(s.Email__c)
                && s.Email__c.equalsIgnoreCase(myEmail)) {
                continue;
            }
            out.add(s);
        }
        return out;
    }

    // active doc shares
    @AuraEnabled
    public static List<TSign_Document_Share__c> fetchStaffByDoc(Id docId) {
        assertNotStaff();
        assertCanModifyDoc(docId);
        return [
            SELECT Id, TSign_Staff__c
            FROM TSign_Document_Share__c
            WHERE TSign_Document__c = :docId
            AND Is_Active__c = true
        ];
    }

    @AuraEnabled
    public static void saveDocumentShares(Id docId, List<Id> staffIds) {
        assertNotStaff();
        if (docId == null) {
            throw new AuraHandledException('Document Id is required');
        }
        TSign_Document__c doc = assertCanModifyDoc(docId);
        Id orgId = doc.TSign_Organisation__c;
        assertShareTargets(staffIds, orgId);

        Set<Id> selected = new Set<Id>();
        if (staffIds != null) {
            selected.addAll(staffIds);
        }

        // make parent folder chain visible in tree for selected staff
        if (doc.TSign_Folder__c != null && !selected.isEmpty()) {
            ensureParentFolderShares(doc.TSign_Folder__c, selected, orgId);
        }

        Map<Id, TSign_Document_Share__c> existingByStaff = new Map<Id, TSign_Document_Share__c>();
        List<TSign_Document_Share__c> existingRows = [
            SELECT Id, TSign_Staff__c, Is_Active__c
            FROM TSign_Document_Share__c
            WHERE TSign_Document__c = :docId
        ];
        for (TSign_Document_Share__c r : existingRows) {
            existingByStaff.put(r.TSign_Staff__c, r);
        }

        List<TSign_Document_Share__c> toInsert = new List<TSign_Document_Share__c>();
        List<TSign_Document_Share__c> toUpdate = new List<TSign_Document_Share__c>();

        for (Id staffId : selected) {
            TSign_Document_Share__c r = existingByStaff.get(staffId);
            if (r == null) {
                toInsert.add(new TSign_Document_Share__c(
                    TSign_Document__c = docId,
                    TSign_Staff__c = staffId,
                    Is_Active__c = true
                ));
            } else if (r.Is_Active__c == false) {
                r.Is_Active__c = true;
                toUpdate.add(r);
            }
        }

        for (TSign_Document_Share__c r : existingByStaff.values()) {
            if (!selected.contains(r.TSign_Staff__c) && r.Is_Active__c == true) {
                r.Is_Active__c = false;
                toUpdate.add(r);
            }
        }

        if (!toInsert.isEmpty()) {
            insert toInsert;
        }
        if (!toUpdate.isEmpty()) {
            update toUpdate;
        }
    }

    // folder + all ancestors become visible (Full_Folder_Access = false)
    public static void ensureParentFolderShares(Id folderId, Set<Id> staffIds, Id orgId) {

        Map<Id, TSign_Folder__c> folderMap = allFolders(orgId);

        Set<Id> chain = new Set<Id>();
        Id curId = folderId;
        Integer guard = 0;
        while (curId != null && folderMap.containsKey(curId) && guard < 20) {
            chain.add(curId);
            curId = folderMap.get(curId).Parent_Folder__c;
            guard++;
        }

        Map<String, TSign_Folder_Share__c> existing = new Map<String, TSign_Folder_Share__c>();
        List<TSign_Folder_Share__c> existingRows = [
            SELECT Id, TSign_Folder__c, TSign_Staff__c, Active__c
            FROM TSign_Folder_Share__c
            WHERE TSign_Folder__c IN :chain
            AND TSign_Staff__c IN :staffIds
        ];
        for (TSign_Folder_Share__c fs : existingRows) {
            existing.put(fs.TSign_Folder__c + '|' + fs.TSign_Staff__c, fs);
        }

        List<TSign_Folder_Share__c> toInsert = new List<TSign_Folder_Share__c>();
        List<TSign_Folder_Share__c> toUpdate = new List<TSign_Folder_Share__c>();

        for (Id fid : chain) {
            for (Id staffId : staffIds) {
                TSign_Folder_Share__c fs = existing.get(fid + '|' + staffId);
                if (fs == null) {
                    toInsert.add(new TSign_Folder_Share__c(
                        TSign_Folder__c = fid,
                        TSign_Staff__c = staffId,
                        Active__c = true,
                        Full_Folder_Access__c = false
                    ));
                } else if (fs.Active__c == false) {
                    fs.Active__c = true;
                    toUpdate.add(fs);
                }
            }
        }

        if (!toInsert.isEmpty()) {
            insert toInsert;
        }
        if (!toUpdate.isEmpty()) {
            update toUpdate;
        }
    }

    // only "full access" shares (the ones set from the Share Folder panel)
    @AuraEnabled
    public static List<TSign_Folder_Share__c> fetchFolderSharedStaff(Id folderId) {
        assertNotStaff();
        if (folderId == null) {
            return new List<TSign_Folder_Share__c>();
        }
        assertCanModifyFolder(folderId);
        return [
            SELECT Id, TSign_Staff__c
            FROM TSign_Folder_Share__c
            WHERE TSign_Folder__c = :folderId
            AND Active__c = true
            AND Full_Folder_Access__c = true
        ];
    }

    /**
     * Folder share = full access. Docs inside (and subfolders) become visible
     * dynamically via getDocuments, so no per-doc share rows are created.
     */
    @AuraEnabled
    public static void saveFolderShares(Id folderId, List<Id> staffIds) {
        assertNotStaff();
        if (folderId == null) {
            throw new AuraHandledException('Folder Id required');
        }
        TSign_Folder__c folder = assertCanModifyFolder(folderId);
        Id orgId = folder.TSign_Organisation__c;
        assertShareTargets(staffIds, orgId);

        Set<Id> selected = new Set<Id>();
        if (staffIds != null) {
            selected.addAll(staffIds);
        }

        Map<Id, TSign_Folder_Share__c> existingByStaff = new Map<Id, TSign_Folder_Share__c>();
        List<TSign_Folder_Share__c> existingRows = [
            SELECT Id, TSign_Staff__c, Active__c, Full_Folder_Access__c
            FROM TSign_Folder_Share__c
            WHERE TSign_Folder__c = :folderId
        ];
        for (TSign_Folder_Share__c fs : existingRows) {
            existingByStaff.put(fs.TSign_Staff__c, fs);
        }

        List<TSign_Folder_Share__c> toInsert = new List<TSign_Folder_Share__c>();
        List<TSign_Folder_Share__c> toUpdate = new List<TSign_Folder_Share__c>();

        for (Id staffId : selected) {
            TSign_Folder_Share__c fs = existingByStaff.get(staffId);
            if (fs == null) {
                toInsert.add(new TSign_Folder_Share__c(
                    TSign_Folder__c = folderId,
                    TSign_Staff__c = staffId,
                    Active__c = true,
                    Full_Folder_Access__c = true
                ));
            } else if (fs.Active__c == false || fs.Full_Folder_Access__c == false) {
                fs.Active__c = true;
                fs.Full_Folder_Access__c = true;
                toUpdate.add(fs);
            }
        }

        // removed: revoke full access. Keep the row active only if the person still
        // has a shared document inside this folder tree (so the path stays visible).
        Map<Id, TSign_Folder__c> folderMap = allFolders(orgId);
        Set<Id> subtree = subtreeIds(folderId, folderMap);

        Set<Id> revoked = new Set<Id>();
        for (TSign_Folder_Share__c fs : existingByStaff.values()) {
            if (!selected.contains(fs.TSign_Staff__c)
                && fs.Active__c == true
                && fs.Full_Folder_Access__c == true) {
                revoked.add(fs.TSign_Staff__c);
            }
        }

        Set<Id> stillViaDocs = new Set<Id>();
        if (!revoked.isEmpty()) {
            List<TSign_Document_Share__c> docShares = [
                SELECT TSign_Staff__c
                FROM TSign_Document_Share__c
                WHERE Is_Active__c = true
                AND TSign_Staff__c IN :revoked
                AND TSign_Document__r.TSign_Folder__c IN :subtree
            ];
            for (TSign_Document_Share__c ds : docShares) {
                stillViaDocs.add(ds.TSign_Staff__c);
            }
        }

        for (TSign_Folder_Share__c fs : existingByStaff.values()) {
            if (revoked.contains(fs.TSign_Staff__c)) {
                fs.Full_Folder_Access__c = false;
                if (!stillViaDocs.contains(fs.TSign_Staff__c)) {
                    fs.Active__c = false;
                }
                toUpdate.add(fs);
            }
        }

        if (!toInsert.isEmpty()) {
            insert toInsert;
        }
        if (!toUpdate.isEmpty()) {
            update toUpdate;
        }

        // ancestors of this folder must be visible for newly added staff
        if (!selected.isEmpty()) {
            Id parentId = [
                SELECT Parent_Folder__c FROM TSign_Folder__c WHERE Id = :folderId
            ].Parent_Folder__c;
            if (parentId != null) {
                ensureParentFolderShares(parentId, selected, orgId);
            }
        }
    }

    @AuraEnabled
    public static TSign_Document__c assertCanViewDoc(Id docId) {
        List<TSign_Document__c> docs = [
            SELECT Id, Name, Type__c, Amazon_file_URL__c, Is_Public__c, Is_Archived__c,
                   TSign_Folder__c, TSign_Organisation__c, CreatedById, CreatedBy.User_Type__c,
                   TSign_Folder__r.CreatedBy.User_Type__c
            FROM TSign_Document__c
            WHERE Id = :docId
            LIMIT 1
        ];
        if (docs.isEmpty()) {
            throw new AuraHandledException('Document not found.');
        }
        TSign_Document__c d = docs[0];
        Id orgId = d.TSign_Organisation__c;
        Id staffId = assertMember(orgId);

        Boolean allowed =
            d.CreatedById == me().Id ||
            d.Is_Public__c == true ||
            adminVisibleTypes().contains(d.CreatedBy.User_Type__c);

        // Org Admin: docs inside folders created by Managers / Org Admins
        if (!allowed && d.TSign_Folder__c != null && d.TSign_Folder__r != null) {
            allowed = adminVisibleTypes().contains(d.TSign_Folder__r.CreatedBy.User_Type__c);
        }

        if (!allowed) {
            List<TSign_Document_Share__c> shareRows = [
                SELECT Id FROM TSign_Document_Share__c
                WHERE TSign_Document__c = :docId
                AND TSign_Staff__c = :staffId
                AND Is_Active__c = true
                LIMIT 1
            ];
            allowed = !shareRows.isEmpty();
        }
        if (!allowed && d.TSign_Folder__c != null) {
            allowed = fullAccessFolderIds(allFolders(orgId), orgId).contains(d.TSign_Folder__c);
        }
        if (!allowed) {
            throw new AuraHandledException('You do not have access to this document.');
        }
        return d;
    }

    @AuraEnabled
    public static List<String> parseEmails(String raw, String label) {
        List<String> out = new List<String>();
        if (String.isBlank(raw)) {
            return out;
        }
        Pattern p = Pattern.compile('^[A-Za-z0-9._%+\\-]+@[A-Za-z0-9.\\-]+\\.[A-Za-z]{2,}$');
        for (String part : raw.split('\\s*[,;]\\s*')) {
            String e = part.trim();
            if (String.isBlank(e)) {
                continue;
            }
            if (!p.matcher(e).matches()) {
                throw new AuraHandledException('Invalid ' + label + ' email address: ' + e);
            }
            out.add(e);
        }
        return out;
    }

    @AuraEnabled
    public static String htmlEsc(String v) {
        return v == null ? '' : v.escapeHtml4();
    }

    @AuraEnabled
    public static Map<String, String> getDocumentEmailContent(Id docId) {
        try {
            assertNotStaff();
            TSign_Document__c d = assertCanViewDoc(docId);

            String orgName = '';
            String fromEmail = '';
            List<TSign_Organisation__c> orgRows = [
                SELECT Name, Email__c FROM TSign_Organisation__c
                WHERE Id = :d.TSign_Organisation__c LIMIT 1
            ];
            for (TSign_Organisation__c o : orgRows) {
                orgName = o.Name;
                fromEmail = o.Email__c == null ? '' : o.Email__c;
            }
            String senderName = UserInfo.getName();

            String docName = htmlEsc(d.Name == null ? '' : d.Name);
            String docType = htmlEsc(d.Type__c == null ? '' : d.Type__c);

            String body =
                'Hello,<br/><br/>' +
                'Please find attached the document <b>' + docName + '</b>' +
                (String.isBlank(docType) ? '' : ' (' + docType + ')') +
                ' shared by <b>' + htmlEsc(senderName) + '</b>' +
                (String.isBlank(orgName) ? '' : ' from <b>' + htmlEsc(orgName) + '</b>') +
                '.<br/><br/>' +
                'If you have any questions or require further clarification, ' +
                'please feel free to contact us.<br/><br/>' +
                'Kind regards,<br/>' +
                '<b>' + htmlEsc(String.isBlank(orgName) ? senderName : orgName) + '</b>';

            return new Map<String, String>{
                'subject'  => 'Document: ' + d.Name,
                'body'     => body,
                'fileName' => d.Name,
                'fromEmail' => fromEmail
            };
        } catch (AuraHandledException e) {
            throw e;
        } catch (Exception e) {
            throw new AuraHandledException('Unable to prepare email: ' + e.getMessage());
        }
    }

    // sends the document (file URL) as an email attachment through the same
    // EmailRelayQueueable used by the invoices module.
    @AuraEnabled
    public static void sendDocumentEmail(
        Id docId,
        String toAddress,
        String ccAddress,
        String subject,
        String body
    ) {
        try {
            assertNotStaff();
            TSign_Document__c d = assertCanViewDoc(docId);

            List<String> toEmails = parseEmails(toAddress, 'To');
            List<String> ccEmails = parseEmails(ccAddress, 'CC');

            if (toEmails.isEmpty()) {
                throw new AuraHandledException('To address is required.');
            }
            if (String.isBlank(subject)) {
                throw new AuraHandledException('Subject is required.');
            }
            // URL is read from the record, never trusted from the client
            if (String.isBlank(d.Amazon_file_URL__c)) {
                throw new AuraHandledException('This document has no file to send.');
            }

            // FROM address = TSign_Organisation__c.Email__c of the document's
            // organisation. The relay only sends from registered/verified
            // addresses, so there is no fallback to the user's own email.
            String senderEmail;
            List<TSign_Organisation__c> orgRows = [
                SELECT Email__c FROM TSign_Organisation__c
                WHERE Id = :d.TSign_Organisation__c LIMIT 1
            ];
            for (TSign_Organisation__c o : orgRows) {
                senderEmail = o.Email__c;
            }
            if (String.isBlank(senderEmail)) {
                throw new AuraHandledException(
                    'The organisation does not have an email address (Email__c). ' +
                    'Please add one before sending documents.'
                );
            }

            System.enqueueJob(
                new EmailRelayQueueable(
                    senderEmail,
                    toEmails,
                    subject,
                    body,
                    new List<String>{ d.Amazon_file_URL__c },
                    ccEmails,
                    new List<String>()
                )
            );

            // EMAIL HISTORY: one log row per send, tied to this document + org.
            // Same transaction as the enqueue: if the log cannot be saved the
            // email is not queued either, so history never misses a send.
            insert new TSign_Email_Log__c(
                TSign_Document__c     = d.Id,
                TSign_Organisation__c = d.TSign_Organisation__c,
                To_Addresses__c       = String.join(toEmails, ', '),
                CC_Addresses__c       = ccEmails.isEmpty() ? null : String.join(ccEmails, ', '),
                Subject__c            = subject.abbreviate(255),
                Sent_Date__c          = System.now()
            );
        } catch (AuraHandledException e) {
            throw e;
        } catch (Exception e) {
            throw new AuraHandledException('Error sending email: ' + e.getMessage());
        }
    }

    // =====================================================================
    // EMAIL HISTORY (read only: never touches the document or its status)
    // =====================================================================

    // newest first. JSON shape = same as repository history
    // (activityDate, user, action, changes) so the same timeline UI is reused.
    @AuraEnabled(cacheable=false)
    public static String getDocumentEmailHistory(Id docId) {
        try {
            // same access rule as viewing the document
            assertNotStaff();
            assertCanViewDoc(docId);

            List<Map<String, Object>> output = new List<Map<String, Object>>();

            List<TSign_Email_Log__c> logRows = [
                SELECT Id, To_Addresses__c, CC_Addresses__c, Subject__c,
                       Sent_Date__c, CreatedDate, CreatedBy.Name
                FROM TSign_Email_Log__c
                WHERE TSign_Document__c = :docId
                ORDER BY Sent_Date__c DESC NULLS LAST, CreatedDate DESC
                LIMIT 500
            ];

            for (TSign_Email_Log__c l : logRows) {
                Integer toCount = String.isBlank(l.To_Addresses__c)
                    ? 0 : l.To_Addresses__c.split(',').size();

                String changes =
                    '<b>To (' + toCount + '):</b> ' + htmlEsc(l.To_Addresses__c) +
                    (String.isBlank(l.CC_Addresses__c)
                        ? ''
                        : '<br/><b>CC:</b> ' + htmlEsc(l.CC_Addresses__c)) +
                    '<br/><b>Subject:</b> ' + htmlEsc(l.Subject__c);

                output.add(new Map<String, Object>{
                    'id'           => l.Id,
                    'activityDate' => l.Sent_Date__c != null ? l.Sent_Date__c : l.CreatedDate,
                    'user'         => l.CreatedBy.Name,
                    'action'       => 'Email Sent',
                    'changes'      => changes
                });
            }

            return JSON.serialize(output);
        } catch (AuraHandledException e) {
            throw e;
        } catch (Exception e) {
            throw new AuraHandledException('Unable to load email history: ' + e.getMessage());
        }
    }

    // =====================================================================
    // DOCUMENT TYPES (custom types per organisation)
    // =====================================================================

    public static final Integer MAX_TYPE_LENGTH = 50;

    // "A,B,C" -> ['A','B','C'] (trimmed, blanks removed)
    public static List<String> parseTypes(String raw) {
        List<String> out = new List<String>();
        if (String.isBlank(raw)) {
            return out;
        }
        for (String part : raw.split(',')) {
            String t = part.trim();
            if (String.isNotBlank(t)) {
                out.add(t);
            }
        }
        return out;
    }

    // custom types of this organisation
    @AuraEnabled
    public static List<String> getDocumentTypes(Id orgId) {
        assertMember(orgId);
        List<TSign_Organisation__c> orgs = [
            SELECT Document_Types__c
            FROM TSign_Organisation__c
            WHERE Id = :orgId
            LIMIT 1
        ];
        return orgs.isEmpty() ? new List<String>() : parseTypes(orgs[0].Document_Types__c);
    }

    // adds one type. returns the updated custom list.
    @AuraEnabled
    public static List<String> saveNewDocumentType(Id orgId, String newType) {
        assertNotStaff();
        assertMember(orgId);

        if (String.isBlank(newType)) {
            throw new AuraHandledException('Type name is required.');
        }
        String value = newType.trim();
        if (value.length() > MAX_TYPE_LENGTH) {
            throw new AuraHandledException(
                'Maximum ' + MAX_TYPE_LENGTH + ' characters allowed.'
            );
        }
        if (value.contains(',')) {
            throw new AuraHandledException('Type name cannot contain a comma.');
        }

        // lock the org row so two users cannot overwrite each other
        TSign_Organisation__c org = [
            SELECT Id, Document_Types__c
            FROM TSign_Organisation__c
            WHERE Id = :orgId
            LIMIT 1
            FOR UPDATE
        ];

        List<String> types = parseTypes(org.Document_Types__c);

        // taken = existing custom types of this org (case insensitive)
        Set<String> taken = new Set<String>();
        for (String t : types) {
            taken.add(t.toLowerCase());
        }
        if (taken.contains(value.toLowerCase())) {
            throw new AuraHandledException('This type already exists.');
        }

        types.add(value);
        org.Document_Types__c = String.join(types, ',');
        update org;

        return types;
    }

    @AuraEnabled
    public static String getOrganisationAccountType(Id orgId) {
        assertMember(orgId);
        List<TSign_Organisation__c> rows = [
            SELECT Account_Type__c
            FROM TSign_Organisation__c
            WHERE Id = :orgId
            LIMIT 1
        ];
        return rows.isEmpty() ? null : rows[0].Account_Type__c;
    }
}