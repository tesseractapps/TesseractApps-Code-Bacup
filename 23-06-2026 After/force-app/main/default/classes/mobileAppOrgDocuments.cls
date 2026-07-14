@RestResource(urlMapping='/repositoryDocuments/*')
global with sharing class mobileAppOrgDocuments {

    @HttpGet
    global static void getRepositoryDocuments() {

        System.debug('=========== 🚀 GET REPOSITORY DOCUMENTS START ===========');

        RestResponse res = RestContext.response;
        Map<String,Object> responseMap = new Map<String,Object>();

        try {

            /* ================= USER ================= */

            Id currentUserId = UserInfo.getUserId();

            User objUser = [
                SELECT Id, Organization_Name__c, User_Type__c
                FROM User
                WHERE Id = :currentUserId
            ];

            /* ================= ORGANISATION ================= */

            List<Organisation__c> orgList = [
                SELECT Id
                FROM Organisation__c
                WHERE Name = :objUser.Organization_Name__c
                LIMIT 1
            ];

            if(orgList.isEmpty()){
                throw new AuraHandledException('Organisation not found');
            }

            Id organisationId = orgList[0].Id;
            String userType = objUser.User_Type__c;

            /* ======================================================
               STEP 1 : FETCH REPOSITORIES
            ====================================================== */

            List<Repository__c> repositories = new List<Repository__c>();

            if (userType == 'HR Admin' 
                || userType == 'Roster Manager' 
                || userType == 'NDIS Staff') {

                Set<Id> accessibleRepositoryIds = new Set<Id>();

                for(Security_Privilege__c sec :
                    [SELECT Repository__c
                     FROM Security_Privilege__c
                     WHERE User__c = :objUser.Id]) {

                    if(sec.Repository__c != null)
                        accessibleRepositoryIds.add(sec.Repository__c);
                }

                if(!accessibleRepositoryIds.isEmpty()){
                    repositories = [
                        SELECT Id, Name, Document_Type__c, Size__c,
                               Comments__c, User_Name__c,
                               Amazon_file_URL__c, Date_Format__c,
                               (SELECT Id, Repository__c, Awsurl__c,
                                       Aws_Json__c, File_Name__c,
                                       Size__c, key__c
                                FROM Repository_Attachments__r)
                        FROM Repository__c
                        WHERE Id IN :accessibleRepositoryIds
                        ORDER BY CreatedDate DESC
                    ];
                }

            } 
            else if (userType == 'Facility Admin' 
                     || userType == 'NDIS Org Admin') {

                repositories = [
                    SELECT Id, Name, Document_Type__c, Size__c,
                           Comments__c, User_Name__c,
                           Amazon_file_URL__c, Date_Format__c,
                           (SELECT Id, Repository__c, Awsurl__c,
                                   Aws_Json__c, File_Name__c,
                                   Size__c, key__c
                            FROM Repository_Attachments__r)
                    FROM Repository__c
                    WHERE Organization__c = :organisationId
                    ORDER BY CreatedDate DESC
                ];
            }
            else{

                responseMap.put('isSuccess', true);
                responseMap.put('data', new List<Object>());
                responseMap.put('message','No Access');

                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                res.statusCode = 200;
                return;
            }

            /* ======================================================
               STEP 2 : FETCH PRIVILEGES
            ====================================================== */

            List<Security_Privilege__c> privileges = new List<Security_Privilege__c>();

            if(!repositories.isEmpty()){
                privileges = [
                    SELECT Repository__c,
                           Repository_Attachment__c,
                           View__c,
                           Edit__c,
                           Delete__c
                    FROM Security_Privilege__c
                    WHERE Repository__c IN :repositories
                    AND User__c = :objUser.Id
                ];
            }

            /* ======================================================
               STEP 3 : BUILD REPOSITORY MAP LIST
               (ONLY INCLUDE REPOS WITH ATTACHMENTS)
            ====================================================== */

            List<Map<String,Object>> repoList = new List<Map<String,Object>>();

            for(Repository__c repo : repositories){

                if(String.isBlank(repo.Document_Type__c)){
                    continue;
                }

                List<Map<String,Object>> childAttachments = new List<Map<String,Object>>();

                for(Repository_Attachment__c att : repo.Repository_Attachments__r){

                    Boolean hasView = false;
                    Boolean hasEdit = false;
                    Boolean hasDelete = false;
                    Boolean hasPrivilege = false;

                    for(Security_Privilege__c sec : privileges){

                        if(sec.Repository_Attachment__c == att.Id){
                            hasPrivilege = true;
                            hasView = sec.View__c;
                            hasEdit = sec.Edit__c;
                            hasDelete = sec.Delete__c;
                            break;
                        }

                        if(sec.Repository__c == repo.Id 
                           && sec.Repository_Attachment__c == null){
                            hasPrivilege = true;
                            hasView = sec.View__c;
                            hasEdit = sec.Edit__c;
                            hasDelete = sec.Delete__c;
                        }
                    }

                    if((userType == 'Facility Admin'
                        || userType == 'NDIS Org Admin')){
                        hasPrivilege = true;
                        hasView = true;
                        hasEdit = true;
                        hasDelete = true;
                    }

                    if(hasPrivilege){

                        Map<String,Object> attMap = new Map<String,Object>();
                        attMap.put('Id', att.Id);
                        attMap.put('Repository__c', att.Repository__c);
                        attMap.put('Awsurl__c', att.Awsurl__c);
                        attMap.put('Aws_Json__c', att.Aws_Json__c);
                        attMap.put('File_Name__c', att.File_Name__c);
                        attMap.put('Size__c', att.Size__c);
                        attMap.put('key__c', att.key__c);
                        attMap.put('HasReadAccess', hasView);
                        attMap.put('HasEditAccess', hasEdit);
                        attMap.put('HasDeleteAccess', hasDelete);

                        childAttachments.add(attMap);
                    }
                }

                // 🚀 ONLY ADD REPO IF IT HAS ATTACHMENTS
                if(!childAttachments.isEmpty()){

                    Map<String,Object> record = new Map<String,Object>();
                    record.put('Id', repo.Id);
                    record.put('Name', repo.Name);
                    record.put('Document_Type__c', repo.Document_Type__c);
                    record.put('Size__c', repo.Size__c);
                    record.put('Comments__c', repo.Comments__c);
                    record.put('User_Name__c', repo.User_Name__c);
                    record.put('Amazon_file_URL__c', repo.Amazon_file_URL__c);
                    record.put('Date_Format__c', repo.Date_Format__c);
                    record.put('Repository_Attachments__r', childAttachments);

                    repoList.add(record);
                }
            }

            /* ======================================================
               STEP 4 : GROUP BY Document_Type__c
               (ONLY GROUPS WITH ATTACHMENTS EXIST NOW)
            ====================================================== */

            Map<String, RepoGroupWrapper> groupMap = new Map<String, RepoGroupWrapper>();

            for(Map<String,Object> repo : repoList){

                String docType = (String)repo.get('Document_Type__c');

                if(!groupMap.containsKey(docType)){

                    RepoGroupWrapper grp = new RepoGroupWrapper();
                    grp.documentTypeName = docType;
                    grp.recordCount = 0;
                    grp.attachmentCount = 0;
                    grp.records = new List<Object>();

                    groupMap.put(docType, grp);
                }

                RepoGroupWrapper g = groupMap.get(docType);

                g.recordCount++;
                g.records.add(repo);

                List<Object> atts =
                    (List<Object>)repo.get('Repository_Attachments__r');

                if(atts != null){
                    g.attachmentCount += atts.size();
                }
            }

            responseMap.put('isSuccess', true);
            responseMap.put('data', groupMap.values());
            responseMap.put('message','Repository documents fetched successfully');
        }
        catch(Exception e){

            responseMap.put('isSuccess', false);
            responseMap.put('message','Error fetching repositories');
            responseMap.put('error', e.getMessage());
        }

        res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
        res.statusCode = 200;

        System.debug('=========== ✅ GET REPOSITORY DOCUMENTS END ===========');
    }

    /* ======================================================
       WRAPPER
    ====================================================== */

    global class RepoGroupWrapper{
        global String documentTypeName;
        global Integer recordCount;
        global Integer attachmentCount;
        global List<Object> records;
    }
}