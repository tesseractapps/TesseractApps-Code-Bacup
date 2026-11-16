public without sharing class TSignStaffUserSyncBatch implements Database.Batchable<SObject> {

    private static final String LOG_PREFIX = '[TSignStaffUserSyncBatch]';

    public Database.QueryLocator start(Database.BatchableContext bc) {
        System.debug(LoggingLevel.INFO, LOG_PREFIX + ' start() called. JobId=' + bc.getJobId());

        Database.QueryLocator ql = Database.getQueryLocator([
            SELECT Id,
                   Email__c,
                   First_Name__c,
                   Last_Name__c,
                   User_Type__c,
                   Status__c
            FROM TSign_Staff__c
            WHERE Update_User__c = true
              AND Email__c != null
        ]);

        System.debug(LoggingLevel.INFO, LOG_PREFIX + ' start() returning QueryLocator.');
        return ql;
    }

    public void execute(Database.BatchableContext bc, List<TSign_Staff__c> scope) {
        Long startTime = System.currentTimeMillis();
        System.debug(LoggingLevel.INFO, LOG_PREFIX + ' execute() started. JobId=' + bc.getJobId()
                     + ', scopeSize=' + (scope == null ? 0 : scope.size()));

        if (scope == null || scope.isEmpty()) {
            System.debug(LoggingLevel.WARN, LOG_PREFIX + ' scope is empty — exiting execute().');
            return;
        }

        // Build map keyed by normalized email (trim + lower). Track staff ids.
        Map<String, TSign_Staff__c> staffByEmail = new Map<String, TSign_Staff__c>();
        List<Id> staffIds = new List<Id>();

        for (TSign_Staff__c s : scope) {
            staffIds.add(s.Id);
            if (String.isBlank(s.Email__c)) {
                System.debug(LoggingLevel.WARN, LOG_PREFIX + ' Staff has blank Email__c. StaffId=' + s.Id);
                continue;
            }
            staffByEmail.put(s.Email__c.trim().toLowerCase(), s);
        }

        System.debug(LoggingLevel.INFO, LOG_PREFIX + ' Mapped staff to emails. staffCount=' + staffByEmail.size());

        if (staffByEmail.isEmpty()) {
            System.debug(LoggingLevel.WARN, LOG_PREFIX + ' staffByEmail is empty — still enqueueing reset.');
            enqueueResetFlag(staffIds);
            return;
        }

        // Query Users by BOTH Email and Username (Username often holds the login email)
        List<User> users = [
            SELECT Id, Email, Username, FirstName, LastName, User_Type__c, IsActive
            FROM User
            WHERE Email IN :staffByEmail.keySet()
               OR Username IN :staffByEmail.keySet()
        ];

        System.debug(LoggingLevel.INFO, LOG_PREFIX + ' Queried users. matchedUsers=' + users.size()
                     + ', requestedEmails=' + staffByEmail.size());

        // Track which staff emails got matched (by email OR username)
        Set<String> matchedEmails = new Set<String>();
        for (User u : users) { if (!String.isBlank(u.Email))    matchedEmails.add(u.Email.trim().toLowerCase()); if (!String.isBlank(u.Username)) matchedEmails.add(u.Username.trim().toLowerCase());
        }
        for (String email : staffByEmail.keySet()) {
            if (!matchedEmails.contains(email)) {
                System.debug(LoggingLevel.WARN, LOG_PREFIX + ' No matching User for staff email=' + email
                             + ' (StaffId=' + staffByEmail.get(email).Id + ')');
            }
        }

        List<User> usersToUpdate = new List<User>();
        for (User u : users) { TSign_Staff__c s = null; String keyUsed = null; if (!String.isBlank(u.Email)) { String key = u.Email.trim().toLowerCase(); s = staffByEmail.get(key); if (s != null) keyUsed = 'Email:' + u.Email; } if (s == null && !String.isBlank(u.Username)) { String key = u.Username.trim().toLowerCase(); s = staffByEmail.get(key); if (s != null) keyUsed = 'Username:' + u.Username;
            }

            if (s == null) {
                System.debug(LoggingLevel.WARN, LOG_PREFIX + ' Null staff lookup for User.Id=' + u.Id
                             + ', Email=' + u.Email + ', Username=' + u.Username);
                continue;
            }

            u.FirstName    = s.First_Name__c;
            u.LastName     = s.Last_Name__c;
            u.User_Type__c = s.User_Type__c;
            u.IsActive     = s.Status__c;
            usersToUpdate.add(u);

            System.debug(LoggingLevel.FINE, LOG_PREFIX + ' Prepared User update: UserId=' + u.Id
                         + ', matchedVia=' + keyUsed
                         + ', Email=' + u.Email
                         + ', FirstName=' + u.FirstName
                         + ', LastName=' + u.LastName
                         + ', UserType=' + u.User_Type__c
                         + ', IsActive=' + u.IsActive);
        }

        System.debug(LoggingLevel.INFO, LOG_PREFIX + ' Prepared usersToUpdate count=' + usersToUpdate.size());

        // Setup object update — the ONLY DML in this batch
        if (!usersToUpdate.isEmpty()) { Database.SaveResult[] results = Database.update(usersToUpdate, false); Integer successCount = 0; Integer failureCount = 0; for (Integer i = 0; i < results.size(); i++) { Database.SaveResult sr = results[i]; User u = usersToUpdate[i]; if (sr.isSuccess()) { successCount++;
                    System.debug(LoggingLevel.INFO, LOG_PREFIX + ' User update SUCCESS. UserId=' + u.Id
                                 + ', Email=' + u.Email + ', Username=' + u.Username);
                } else {
                    failureCount++;

                    // Log each error individually so nothing is truncated
                    System.debug(LoggingLevel.ERROR, LOG_PREFIX + ' User update FAILED. UserId=' + u.Id
                                 + ', Email=' + u.Email + ', Username=' + u.Username
                                 + ', ErrorCount=' + sr.getErrors().size());

                    for (Database.Error err : sr.getErrors()) {
                        System.debug(LoggingLevel.ERROR, LOG_PREFIX
                                     + '   -> Status=' + err.getStatusCode()
                                     + ' | Fields=' + err.getFields()
                                     + ' | Message=' + err.getMessage());
                    }

                    // Also dump the full error list as a fallback
                    System.debug(LoggingLevel.ERROR, LOG_PREFIX + '   FullErrors=' + sr.getErrors());
                }
            }

            System.debug(LoggingLevel.INFO, LOG_PREFIX + ' DML complete. success=' + successCount
                         + ', failures=' + failureCount);
        } else {
            System.debug(LoggingLevel.INFO, LOG_PREFIX + ' No users to update — skipping DML.');
        }

        // Reset the flag in a SEPARATE transaction (Queueable = new txn boundary)
        enqueueResetFlag(staffIds);

        System.debug(LoggingLevel.INFO, LOG_PREFIX + ' execute() finished. elapsedMs='
                     + (System.currentTimeMillis() - startTime));
    }

    public void finish(Database.BatchableContext bc) {
        System.debug(LoggingLevel.INFO, LOG_PREFIX + ' finish() called. JobId=' + bc.getJobId());

        if (bc.getJobId() != null) {
            AsyncApexJob job = [
                SELECT Id, Status, NumberOfErrors, JobItemsProcessed, TotalJobItems
                FROM AsyncApexJob
                WHERE Id = :bc.getJobId()
            ];
            System.debug(LoggingLevel.INFO, LOG_PREFIX + ' Job summary: Status=' + job.Status
                         + ', JobItemsProcessed=' + job.JobItemsProcessed
                         + '/' + job.TotalJobItems
                         + ', NumberOfErrors=' + job.NumberOfErrors);

            if (job.NumberOfErrors > 0) {
                System.debug(LoggingLevel.ERROR, LOG_PREFIX + ' Job completed with errors=' + job.NumberOfErrors);
            }
        }
    }

    // ---- Helper: enqueue the reset-flag Queueable safely ----
    private void enqueueResetFlag(List<Id> staffIds) {
        if (staffIds == null || staffIds.isEmpty()) {
            System.debug(LoggingLevel.WARN, LOG_PREFIX + ' staffIds empty — nothing to enqueue for reset.');
            return;
        }
        try {
            Id jobId = System.enqueueJob(new TSignStaffResetFlagQueueable(staffIds));
            System.debug(LoggingLevel.INFO, LOG_PREFIX + ' Enqueued reset-flag queueable. queueableJobId='
                         + jobId + ', staffIdsCount=' + staffIds.size());
        } catch (Exception e) {
            System.debug(LoggingLevel.ERROR, LOG_PREFIX + ' Failed to enqueue reset-flag queueable: '
                         + e.getMessage() + ' | Stack: ' + e.getStackTraceString());
        }
    }
}