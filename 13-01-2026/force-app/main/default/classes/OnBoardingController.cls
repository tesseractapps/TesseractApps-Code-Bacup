public without sharing class OnBoardingController {
    public class Result {
        @AuraEnabled public String email;
        @AuraEnabled public Boolean success;
        @AuraEnabled public String recordId;
        @AuraEnabled public String message;
    }

@AuraEnabled
public static List<Result> createOnboardingRawAndEmail(List<Map<String, Object>> rows, String baseUrl,Id facilityId,Id orgId) {
    // 1) Create records (your existing logic)
    List<Result> out = new List<Result>();
    if (rows == null || rows.isEmpty()) return out;
   if (facilityId != null) {
        Integer cnt = [SELECT COUNT() FROM Facility__c WHERE Id = :facilityId];
        if (cnt == 0) {
            System.debug(LoggingLevel.WARN, 'createOnboardingRawAndEmail: facilityId provided but NOT found -> ' + String.valueOf(facilityId));
            facilityId = null;
        } else {
            System.debug(LoggingLevel.WARN, 'createOnboardingRawAndEmail: using facilityId -> ' + String.valueOf(facilityId));
        }
    } else {
        System.debug(LoggingLevel.WARN, 'createOnboardingRawAndEmail: facilityId is NULL; records will be created without Facility__c');
    }
    if (orgId != null) {
            Integer ocnt = [SELECT COUNT() FROM Organisation__c WHERE Id = :orgId];
            if (ocnt == 0) {
                System.debug(LoggingLevel.WARN,
                    'createOnboardingRawAndEmail: orgId provided but NOT found -> ' + String.valueOf(orgId));
                orgId = null;
            } else {
                System.debug(LoggingLevel.WARN,
                    'createOnboardingRawAndEmail: using orgId -> ' + String.valueOf(orgId));
            }
        } else {
            System.debug(LoggingLevel.WARN,
                'createOnboardingRawAndEmail: orgId is NULL; records will be created without Organization__c');
        }

    // ---- Pass 1: placeholders & payload emails
    Set<String> payloadEmails = new Set<String>();
    List<String> emailByIndex = new List<String>();
    Map<String, Integer> firstSeenAt = new Map<String, Integer>();

    for (Integer i = 0; i < rows.size(); i++) {
        Map<String, Object> m = rows[i];
        String email    = (m == null) ? null : (String)m.get('email');
        String userType = (m == null) ? null : (String)m.get('userType');

        Result res = new Result();
        res.email = email;
        res.success = false;
        out.add(res);

        emailByIndex.add(email);
        if (!String.isBlank(email)) {
            if (!firstSeenAt.containsKey(email)) {
                firstSeenAt.put(email, i);
                payloadEmails.add(email);
            }
        }
    }

    // ---- Fetch existing by email
    Set<String> existingEmails = new Set<String>();
    if (!payloadEmails.isEmpty()) {
        for (Onboarding__c o : [
            SELECT Email__c FROM Onboarding__c WHERE Email__c IN :payloadEmails
        ]) existingEmails.add(o.Email__c);
    }

    // ---- Decide which to insert
    List<Onboarding__c> toInsert = new List<Onboarding__c>();
    List<Integer> dmlIndexToOutIndex = new List<Integer>();
    Set<String> queuedEmails = new Set<String>();

    for (Integer i = 0; i < out.size(); i++) {
        Result res = out[i];
        String email = emailByIndex[i];
        Map<String, Object> m = rows[i];
        String userType = (m == null) ? null : (String)m.get('userType');
         String role     = (m == null) ? null : (String)m.get('role');

        if (String.isBlank(email)) {
            Onboarding__c recBlank = new Onboarding__c();
            recBlank.Email__c     = email;
            recBlank.User_Type__c = userType;
             recBlank.Role__c      = role;   
            if (facilityId != null)  recBlank.Facility__c    = facilityId;
                if (orgId != null)       recBlank.Organization__c = orgId; 
            toInsert.add(recBlank);
            dmlIndexToOutIndex.add(i);
            continue;
        }
        if (existingEmails.contains(email)) {
            res.message = 'Duplicate: email already exists';
            continue;
        }
        Integer firstIdx = firstSeenAt.get(email);
        if (firstIdx != null && firstIdx != i) {
            res.message = 'Duplicate in upload';
            continue;
        }
        if (queuedEmails.contains(email)) {
            res.message = 'Duplicate in upload';
            continue;
        }

        Onboarding__c rec = new Onboarding__c();
        rec.Email__c     = email;
        rec.User_Type__c = userType;
        if (facilityId != null) rec.Facility__c = facilityId;
        if (orgId != null)       rec.Organization__c = orgId; 
         rec.Role__c      = role;
        rec.Status__c    = 'Request Sent';
        toInsert.add(rec);
        dmlIndexToOutIndex.add(i);
        queuedEmails.add(email);
    }

    // ---- DML
    List<Id> createdIds = new List<Id>();
    if (!toInsert.isEmpty()) {
        Database.SaveResult[] srs = Database.insert(toInsert, false);
        for (Integer j = 0; j < srs.size(); j++) {
            Integer outIdx = dmlIndexToOutIndex[j];
            Result res = out[outIdx];
            Database.SaveResult sr = srs[j];
            if (sr.isSuccess()) {
                res.success  = true;
                res.recordId = sr.getId();
                res.message  = null;
                createdIds.add(sr.getId());
            } else {
                res.success = false;
                res.message = firstError(sr);
            }
        }
    }

    // 2) Send emails only for the ones we created
    	system.debug('baseUrl >>>'+ baseUrl);
    	system.debug('createdIds >>>'+ createdIds);
    if (!String.isBlank(baseUrl) && !createdIds.isEmpty()) {
        List<Result> sendRes = sendOnboardingEmails(createdIds, baseUrl);

        Map<Id, Result> sendById = new Map<Id, Result>();
        Map<String, Id> emailToId = new Map<String, Id>();
        for (Result r : out) if (r.success && r.recordId != null) emailToId.put(r.email, (Id)r.recordId);
        for (Result s : sendRes) {
            Id rid = emailToId.get(s.email);
            if (rid != null) sendById.put(rid, s);
        }
        for (Result r : out) {
            if (r.success && r.recordId != null) {
                Result mail = sendById.get((Id)r.recordId);
                if (mail != null) {
                    if (mail.success) {
                        r.message = null; // or 'Email sent'
                    } else {
                        r.message = 'Email send failed: ' + (mail.message == null ? 'Unknown' : mail.message);
                    }
                }
            }
        }
    }

    return out;
}
   // helper for DML errors
    private static String firstError(Database.SaveResult sr) {
        if (sr == null) return 'Unknown error';
        Database.Error[] errs = sr.getErrors();
        if (errs == null || errs.isEmpty()) return 'Unknown error';
        return errs[0].getMessage();
    }
    
public class RowDTO {
    @AuraEnabled public Id id;
    @AuraEnabled public String email;
    @AuraEnabled public String userType;
    @AuraEnabled public String role;
    @AuraEnabled public Datetime createdDate;
    @AuraEnabled public String createdDateDisplay;
    @AuraEnabled public String status;
    @AuraEnabled public Boolean userAccountNeeded;
     @AuraEnabled public String payloadJson;
     @AuraEnabled public Id facilityId;
    @AuraEnabled public String facilityName;
}

@AuraEnabled
public static List<RowDTO> getOnboardingList(Integer maxRows, Id facilityId, Id orgId) {
    Integer lim = (maxRows == null || maxRows <= 0) ? 200 : maxRows;
    List<RowDTO> out = new List<RowDTO>();

    // Guard 1: both ids must be provided
    if (facilityId == null || orgId == null) {
        System.debug(LoggingLevel.WARN,
            'getOnboardingList: skipping query because facilityId or orgId is null. ' +
            'facilityId=' + String.valueOf(facilityId) + ', orgId=' + String.valueOf(orgId));
        return out;
    }

    // Guard 2: ensure the lookups actually exist (avoid returning "Facility__c = null" rows, etc.)
    if ([SELECT COUNT() FROM Facility__c WHERE Id = :facilityId] == 0 ||
        [SELECT COUNT() FROM Organisation__c WHERE Id = :orgId] == 0) {
        System.debug(LoggingLevel.WARN,
            'getOnboardingList: skipping query because facility/org not found. ' +
            'facilityId=' + String.valueOf(facilityId) + ', orgId=' + String.valueOf(orgId));
        return out;
    }

    // Query only when both filters are present and valid
    for (Onboarding__c o : [
        SELECT Id, Email__c, User_Type__c, Role__c, CreatedDate, Status__c,
               User_Account_Needed__c, Recieved_Data__c,Facility__c,
               Facility__r.Name
        FROM Onboarding__c
        WHERE Facility__c = :facilityId
          AND Organization__c = :orgId
        ORDER BY CreatedDate DESC
        LIMIT :lim
    ]) {
        RowDTO r = new RowDTO();
        r.id                = o.Id;
        r.email             = o.Email__c;
        r.userType          = o.User_Type__c;
        r.role              = o.Role__c;
        r.createdDate       = o.CreatedDate;
       r.createdDateDisplay = o.CreatedDate.format('dd/MM/yyyy, hh:mm a');
        r.status            = o.Status__c;
        r.userAccountNeeded = o.User_Account_Needed__c;
        r.payloadJson       = o.Recieved_Data__c;
        r.facilityId        = o.Facility__c;
        r.facilityName      = o.Facility__r.Name;
        out.add(r);
    }
    return out;
}

@AuraEnabled
public static List<RowDTO> getOnboardingListByOrg(Integer maxRows, Id orgId) {
    Integer lim = (maxRows == null || maxRows <= 0) ? 200 : maxRows;
    List<RowDTO> out = new List<RowDTO>();

    // Guard: need a valid org id
    if (orgId == null || [SELECT COUNT() FROM Organisation__c WHERE Id = :orgId] == 0) {
        System.debug(LoggingLevel.WARN, 'getOnboardingListByOrg: missing/invalid orgId -> ' + String.valueOf(orgId));
        return out;
    }

    for (Onboarding__c o : [
        SELECT Id,
               Email__c,
               User_Type__c,
               Role__c,
               CreatedDate,
               Status__c,
               User_Account_Needed__c,
               Recieved_Data__c,
               Facility__c,
               Facility__r.Name
        FROM Onboarding__c
        WHERE Organization__c = :orgId
        ORDER BY CreatedDate DESC
        LIMIT :lim
    ]) {
        RowDTO r = new RowDTO();
        r.id                = o.Id;
        r.email             = o.Email__c;
        r.userType          = o.User_Type__c;
        r.role              = o.Role__c;
        r.createdDate       = o.CreatedDate;
      r.createdDateDisplay = o.CreatedDate.format('dd/MM/yyyy, hh:mm a');
        r.status            = o.Status__c;
        r.userAccountNeeded = o.User_Account_Needed__c;
        r.payloadJson       = o.Recieved_Data__c;
        r.facilityId        = o.Facility__c;
        r.facilityName      = o.Facility__r.Name;

        out.add(r);
    }
    return out;
}

    
@AuraEnabled
public static List<Result> sendOnboardingEmails(List<Id> onboardingIds, String baseUrl) {
    List<Result> out = new List<Result>();
    try {
        if (onboardingIds == null || onboardingIds.isEmpty()) {
            throw new AuraHandledException('No onboarding record Ids provided.');
        }
        if (String.isBlank(baseUrl)) {
            throw new AuraHandledException('Base URL is required.');
        }

        // 1) Query onboarding records (pull fields to render email + fields to update)
        List<Onboarding__c> onboardings = [
            SELECT Id,
                   Email__c,
                   User_Type__c,
                   Role__c,
                   Expire__c,
                   Link_Active__c,
                   Facility__c,
                   Facility__r.Name,
                   Facility__r.Manager_Name__c,
                   Organization__c,
                   Organization__r.Name
            FROM Onboarding__c
            WHERE Id IN :onboardingIds
        ];

        // 2) Set expiration and activate link on each Onboarding__c
        Datetime expirationTime = System.now().addDays(1);
        for (Onboarding__c ob : onboardings) {
            ob.Expire__c = expirationTime;
            ob.Link_Active__c = true;
        }
        if (!onboardings.isEmpty()) {
            update onboardings;
        }

        // 3) Org-Wide Email Address to send from
        OrgWideEmailAddress orgWideEmail = [
            SELECT Id
            FROM OrgWideEmailAddress
            WHERE Address = :System.Label.OrgWideEmailAddress
            LIMIT 1
        ];

        // 4) Build and send emails
        List<Messaging.SingleEmailMessage> msgs = new List<Messaging.SingleEmailMessage>();
        List<Id> idsQueued = new List<Id>(); // NEW: record ids aligned to msgs/sendRes order

        for (Onboarding__c ob : onboardings) {
            Result res = new Result();
            res.email = ob.Email__c;
            res.success = false;
            out.add(res);

            if (String.isBlank(ob.Email__c)) {
                res.message = 'Missing email on Onboarding record';
                continue;
            }

            // --- build encoded payload with email + userType + expiry (ISO8601 GMT) ---
            String emailVal        = ob.Email__c;
            String userTypeVal     = ob.User_Type__c;
            String roleVal         = ob.Role__c;

            // Role display with aliases
            String roleDisplay;
           if (!String.isBlank(roleVal)) {
                String r = roleVal.trim();
                if (r == 'Portal Account Partner Manager') {
                    roleDisplay = 'Roster Manager';
                } else if (r == 'Portal Account Partner User') {
                    roleDisplay = 'Staff';
                } else {
                    roleDisplay = roleVal;
                }
            } else {
                roleDisplay = String.isBlank(userTypeVal) ? 'team member' : userTypeVal;
            }


            String facilityIdVal   = (ob.Facility__c == null) ? '' : String.valueOf(ob.Facility__c);
            String facilityNameVal = (ob.Facility__r == null || String.isBlank(ob.Facility__r.Name)) ? '' : ob.Facility__r.Name;
            String managerNameVal  = (ob.Facility__r == null) ? '' : ob.Facility__r.Manager_Name__c;

            String orgIdVal        = (ob.Organization__c == null) ? '' : String.valueOf(ob.Organization__c);
            String orgNameVal      = (ob.Organization__r == null || String.isBlank(ob.Organization__r.Name)) ? '' : ob.Organization__r.Name;

            // ISO8601 GMT for reliability
            String expIso = expirationTime.formatGmt('yyyy-MM-dd\'T\'HH:mm:ss\'Z\'');
            // Individually encode parts that may contain special chars (defensive)
            String encodedExpiration = EncodingUtil.base64Encode(Blob.valueOf(expIso));

            // Compose the raw payload: include recordId, email, userType, exp
            String rawPayload =
                'recordId='      + ob.Id +
                '&email='        + emailVal +
                '&userType='     + (userTypeVal == null ? '' : userTypeVal) +
                '&role='         + enc(roleVal) +
                '&exp='          + encodedExpiration +
                '&facilityId='   + facilityIdVal +
                '&facilityName=' + facilityNameVal +
                '&orgId='        + orgIdVal +
                '&orgName='      + orgNameVal;

            // Base64 the whole payload, then URL-encode for safety in querystring
            String encodedData = EncodingUtil.base64Encode(Blob.valueOf(rawPayload));
            String safeData    = EncodingUtil.urlEncode(encodedData, 'UTF-8');

            // Final URL
            String secureUrl   = baseUrl + '?data=' + safeData;

            // Friendly name from email
            String recipientName = ob.Email__c.substringBefore('@').replace('.', ' ').capitalize();

            // Subject per your spec
            String subject = 'You\u2019ve been invited to join ' +
                             (String.isBlank(orgNameVal) ? 'our organisation' : orgNameVal);

            // Body per your spec (unchanged)
            String body =
'<!DOCTYPE html>' +
'<html>' +
'<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#ffffff;">' +

  '<div style="max-width:700px;margin:0 auto;background:#ffffff;border-radius:8px;border:1px solid #ddd;">' +

    '<div style="padding:20px 30px;border-bottom:1px solid #eee;">' +
      '<h2 style="margin:0;color:#003466;font-weight:700;">Invitation to Join ' +
         (String.isBlank(orgNameVal) ? 'our organisation' : orgNameVal) + '</h2>' +
    '</div>' +

    '<div style="padding:30px;font-size:14px;color:#333;line-height:1.6;">' +

      '<p>Hi ' + recipientName + ',</p>' +

      '<p>You&rsquo;ve been invited to join ' +
        (String.isBlank(orgNameVal) ? 'our organisation' : ('<strong>' + orgNameVal + '</strong>')) +
        (String.isBlank(facilityNameVal) ? '' : ' at <strong>' + facilityNameVal + '</strong>') +
        ' as a <strong>' + roleDisplay + '</strong>.</p>' +

      '<p>Please complete your onboarding by filling out the secure form below:</p>' +

      '<div style="text-align:center;margin:24px 0;">' +
        '<a href="' + secureUrl + '" ' +
           'style="background-color:#0070d2;color:#ffffff;padding:12px 20px;text-decoration:none;' +
                  'border-radius:8px;display:inline-block;font-weight:bold;">Open Secure Form</a>' +
      '</div>' +

      '<p><strong>What happens when you click the link?</strong><br/>' +
      'It will open a secure page where you can create your profile in our organisation by completing the form.</p>' +

      '<p><em>Note:</em> This link is unique to you and will expire in <strong>14 days</strong>.</p>' +

      '<p>If the button above doesn&rsquo;t work, copy and paste this URL into your browser:</p>' +
      '<p style="word-break:break-all;"><a href="' + secureUrl + '">' + secureUrl + '</a></p>' +

      '<hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />' +

      '<p><strong>Need help?</strong> If you have questions or didn&rsquo;t expect this email, please contact your administrator.</p>' +

      '<p>Looking forward to having you onboard!</p>' +

      '<p style="margin-top:16px;">Best regards,<br/>' +
        (String.isBlank(managerNameVal)
            ? (String.isBlank(facilityNameVal) ? '' : (facilityNameVal + ' Team'))
            : managerNameVal) + '<br/>' +
        (String.isBlank(orgNameVal) ? '' : orgNameVal) + '</p>' +

    '</div>' +
  '</div>' +

'</body>' +
'</html>';

            Messaging.SingleEmailMessage msg = new Messaging.SingleEmailMessage();
            msg.setToAddresses(new String[] { ob.Email__c });
            msg.setSubject(subject);
            msg.setHtmlBody(body);
            msg.setOrgWideEmailAddressId(orgWideEmail.Id);
            msgs.add(msg);

            // NEW: keep id in the same order as msgs/send results
            idsQueued.add(ob.Id);
        }

        if (!msgs.isEmpty()) {
            Messaging.SendEmailResult[] sendRes = Messaging.sendEmail(msgs, false);

            // NEW: persist outcome to Onboarding__c
            List<Onboarding__c> flagUpdates = new List<Onboarding__c>();

            Integer j = 0;
            for (Integer i = 0; i < out.size(); i++) {
                if (String.isBlank(out[i].email)) continue; // we didn't send for blank emails

                Messaging.SendEmailResult sr = sendRes[j++];
                Boolean ok = sr.isSuccess();

                // reflect to the API result (unchanged pattern)
                if (ok) {
                    out[i].success = true;
                    out[i].message = null;
                } else {
                    out[i].success = false;
                    out[i].message = (sr.getErrors() != null && !sr.getErrors().isEmpty())
                        ? sr.getErrors()[0].getMessage()
                        : 'Unknown email send error';
                }

                // map to the correct Onboarding Id in the queued order
                Id targetId = idsQueued[j - 1];

                flagUpdates.add(new Onboarding__c(
                    Id = targetId,
                    Email_Sent__c = ok,
                    Email_Sent_Last_Error__c = ok
                        ? null
                        : out[i].message
                ));
            }

            if (!flagUpdates.isEmpty()) {
                update flagUpdates;
            }
        }

        return out;
    } catch (Exception ex) {
        // NEW: if the whole send fails, mark all as failed so UI can surface them
        try {
            if (onboardingIds != null && !onboardingIds.isEmpty()) {
                List<Onboarding__c> toFail = new List<Onboarding__c>();
                for (Id oid : onboardingIds) {
                    toFail.add(new Onboarding__c(
                        Id = oid,
                        Email_Sent__c = false,
                        Email_Sent_Last_Error__c = ex.getMessage()
                    ));
                }
                if (!toFail.isEmpty()) update toFail;
            }
        } catch (Exception ignore) {}
        throw new AuraHandledException('Error sending onboarding emails: ' + ex.getMessage());
    }
}
    
    // Add anywhere inside OnBoardingController (top-level, not nested in a method)
private static String enc(String s) {
    return s == null ? '' : EncodingUtil.urlEncode(s, 'UTF-8');
}


@AuraEnabled
public static List<Result> sendOnboardingReminderEmails(List<Id> onboardingIds, String baseUrl) {
    List<Result> out = new List<Result>();
    try {
        if (onboardingIds == null || onboardingIds.isEmpty()) {
            throw new AuraHandledException('No onboarding record Ids provided.');
        }
        if (String.isBlank(baseUrl)) {
            throw new AuraHandledException('Base URL is required.');
        }

        // 1) Query onboarding records (includes Facility Manager + Role if you need later)
        List<Onboarding__c> onboardings = [
            SELECT Id,
                   Email__c,
                   User_Type__c,
                   Role__c,
                   Expire__c,
                   Link_Active__c,
                   Facility__c,
                   Facility__r.Name,
                   Facility__r.Manager_Name__c,
                   Organization__c,
                   Organization__r.Name
            FROM Onboarding__c
            WHERE Id IN :onboardingIds
        ];

        // 2) Reactivate link and extend expiry (14 days from now)
        Datetime expirationTime = System.now().addDays(1);
        for (Onboarding__c ob : onboardings) {
            ob.Expire__c = expirationTime;
            ob.Link_Active__c = true;
        }
        if (!onboardings.isEmpty()) {
            update onboardings;
        }

        // 3) Org-Wide Email Address
        OrgWideEmailAddress orgWideEmail = [
            SELECT Id
            FROM OrgWideEmailAddress
            WHERE Address = :System.Label.OrgWideEmailAddress
            LIMIT 1
        ];

        // 4) Build and send reminder emails
        List<Messaging.SingleEmailMessage> msgs = new List<Messaging.SingleEmailMessage>();
        for (Onboarding__c ob : onboardings) {
            Result res = new Result();
            res.email = ob.Email__c;
            res.success = false;
            out.add(res);

            if (String.isBlank(ob.Email__c)) {
                res.message = 'Missing email on Onboarding record';
                continue;
            }

            // --- Build the secure URL (same scheme as initial invite) ---
            String emailVal         = ob.Email__c;
            String userTypeVal      = ob.User_Type__c;

            String facilityIdVal    = (ob.Facility__c == null) ? '' : String.valueOf(ob.Facility__c);
            String facilityNameVal  = (ob.Facility__r == null || String.isBlank(ob.Facility__r.Name)) ? '' : ob.Facility__r.Name;
            String managerNameVal   = (ob.Facility__r == null) ? '' : ob.Facility__r.Manager_Name__c;

            String orgIdVal         = (ob.Organization__c == null) ? '' : String.valueOf(ob.Organization__c);
            String orgNameVal       = (ob.Organization__r == null || String.isBlank(ob.Organization__r.Name)) ? '' : ob.Organization__r.Name;

            String expIso           = expirationTime.formatGmt('yyyy-MM-dd\'T\'HH:mm:ss\'Z\'');
            String encodedExpiration= EncodingUtil.base64Encode(Blob.valueOf(expIso));

            String rawPayload =
                'recordId='      + ob.Id +
                '&email='        + emailVal +
                '&userType='     + (userTypeVal == null ? '' : userTypeVal) +
                '&exp='          + encodedExpiration +
                '&facilityId='   + facilityIdVal +
                '&facilityName=' + facilityNameVal +
                '&orgId='        + orgIdVal +
                '&orgName='      + orgNameVal;

            String encodedData = EncodingUtil.base64Encode(Blob.valueOf(rawPayload));
            String safeData    = EncodingUtil.urlEncode(encodedData, 'UTF-8');
            String secureUrl   = baseUrl + '?data=' + safeData;

            // Friendly name from email
            String recipientName = ob.Email__c.substringBefore('@').replace('.', ' ').capitalize();

            // Subject per your spec
            String subject = 'Reminder: Complete Your Onboarding for ' +
                             (String.isBlank(orgNameVal) ? 'our organisation' : orgNameVal);

            // Body per your spec (simple, focused reminder)
            String body =
'<!DOCTYPE html>' +
'<html>' +
'<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#ffffff;">' +

  '<div style="max-width:700px;margin:0 auto;background:#ffffff;border-radius:8px;border:1px solid #ddd;">' +

    '<div style="padding:20px 30px;border-bottom:1px solid #eee;">' +
      '<h2 style="margin:0;color:#003466;font-weight:700;">Reminder: Complete Your Onboarding</h2>' +
    '</div>' +

    '<div style="padding:30px;font-size:14px;color:#333;line-height:1.6;">' +

      '<p>Hi ' + recipientName + ',</p>' +

      '<p>We noticed you haven&rsquo;t completed your onboarding form for ' +
        (String.isBlank(orgNameVal) ? 'our organisation' : ('<strong>' + orgNameVal + '</strong>')) +
        (String.isBlank(facilityNameVal) ? '' : ' at <strong>' + facilityNameVal + '</strong>') +
        ' yet.</p>' +

      '<p>Please click the link below to resume and complete your form:</p>' +

      '<div style="text-align:center;margin:24px 0;">' +
        '<a href="' + secureUrl + '" ' +
           'style="background-color:#0070d2;color:#ffffff;padding:12px 20px;text-decoration:none;' +
                  'border-radius:8px;display:inline-block;font-weight:bold;">Resume Onboarding</a>' +
      '</div>' +

      '<p>If you need any assistance, don&rsquo;t hesitate to reach out to us.</p>' +

      '<p>Looking forward to having you onboard!</p>' +

      '<p style="margin-top:16px;">Best regards,<br/>' +
        (String.isBlank(managerNameVal)
            ? (String.isBlank(facilityNameVal) ? '' : (facilityNameVal + ' Team'))
            : managerNameVal) + '<br/>' +
        (String.isBlank(orgNameVal) ? '' : orgNameVal) + '</p>' +

      '<hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />' +

      '<p>If the button above doesn&rsquo;t work, copy and paste this URL into your browser:</p>' +
      '<p style="word-break:break-all;"><a href="' + secureUrl + '">' + secureUrl + '</a></p>' +

    '</div>' +
  '</div>' +

'</body>' +
'</html>';

            Messaging.SingleEmailMessage msg = new Messaging.SingleEmailMessage();
            msg.setToAddresses(new String[] { ob.Email__c });
            msg.setSubject(subject);
            msg.setHtmlBody(body);
            msg.setOrgWideEmailAddressId(orgWideEmail.Id);
            msgs.add(msg);
        }

        if (!msgs.isEmpty()) {
            Messaging.SendEmailResult[] sendRes = Messaging.sendEmail(msgs, false);
            Integer j = 0;
            for (Integer i = 0; i < out.size(); i++) {
                if (String.isBlank(out[i].email)) continue;
                Messaging.SendEmailResult sr = sendRes[j++];
                if (sr.isSuccess()) {
                    out[i].success = true;
                    out[i].message = null;
                } else {
                    out[i].success = false;
                    out[i].message = (sr.getErrors() != null && !sr.getErrors().isEmpty())
                        ? sr.getErrors()[0].getMessage()
                        : 'Unknown email send error';
                }
            }
        }

        return out;
    } catch (Exception ex) {
        throw new AuraHandledException('Error sending reminder emails: ' + ex.getMessage());
    }
}

    @AuraEnabled
public static Boolean isLinkActive(Id onboardingId) {
    if (onboardingId == null) return false;

    Onboarding__c rec = [
        SELECT Link_Active__c
        FROM Onboarding__c
        WHERE Id = :onboardingId
        LIMIT 1
    ];
    return rec.Link_Active__c;
}

    
public class SaveResultDTO {
        @AuraEnabled public Boolean success;
        @AuraEnabled public String message;
    }

@AuraEnabled
public static SaveResultDTO saveOnboardingReceivedDataR(Id onboardingId, String payloadJson, Boolean deactivateLink) {
    SaveResultDTO r = new SaveResultDTO();
    try {
        if (onboardingId == null) {
            r.success = false; r.message = 'Onboarding Id is required.'; return r;
        }
        if (payloadJson == null) payloadJson = '';

        Integer maxLen = 131000;
        if (payloadJson.length() > maxLen) payloadJson = payloadJson.substring(0, maxLen);

        // Pull current record info for email fields BEFORE update
        Onboarding__c cur = [
            SELECT Id, Email__c, Organization__c, Organization__r.Name
            FROM Onboarding__c
            WHERE Id = :onboardingId
            LIMIT 1
        ];

        System.debug(LoggingLevel.WARN,
            'saveOnboardingReceivedDataR: id=' + onboardingId + ', len=' + payloadJson.length());

        // Update status + payload (and optionally deactivate link)
        Onboarding__c upd = new Onboarding__c(
            Id = onboardingId,
            Recieved_Data__c = payloadJson,
            Status__c = 'Data Received'
        );
        if (deactivateLink == true) {
            upd.Link_Active__c = false;
        }

        update upd;

        // --- Acknowledgement email (best-effort; does not block success) ---
        String recipientEmail = cur.Email__c;
        if (String.isBlank(recipientEmail)) {
            r.success = true; r.message = 'OK (no email on record)'; return r;
        }

        String orgNameVal   = (cur.Organization__r == null) ? null : cur.Organization__r.Name;
        String displayOrg   = String.isBlank(orgNameVal) ? 'our organisation' : orgNameVal;
        String recipientName= recipientEmail.substringBefore('@').replace('.', ' ').capitalize();

        // Subject: We’ve Received Your Details – [Org Name]
        String subject = 'We\u2019ve Received Your Details \u2013 ' + displayOrg;

        // Simple, branded-friendly HTML body per your copy
        String body =
'<!DOCTYPE html>' +
'<html>' +
'<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#ffffff;">' +
  '<div style="max-width:700px;margin:0 auto;background:#ffffff;border-radius:8px;border:1px solid #ddd;">' +
    '<div style="padding:20px 30px;border-bottom:1px solid #eee;">' +
      '<h2 style="margin:0;color:#003466;font-weight:700;">We&rsquo;ve Received Your Details</h2>' +
    '</div>' +
    '<div style="padding:30px;font-size:14px;color:#333;line-height:1.6;">' +
      '<p>Hi ' + recipientName + ',</p>' +
      '<p>Thank you for submitting your onboarding details.</p>' +
      '<p>Our admin team will review your information and get back to you with the next steps shortly.</p>' +
      '<p>We look forward to having you onboard!</p>' +
      '<p style="margin-top:16px;">Best regards,<br/>' + displayOrg + '</p>' +
    '</div>' +
  '</div>' +
'</body>' +
'</html>';

        // Use Org-Wide Email Address if configured (same label you use elsewhere)
        Id oweaId;
        try {
            OrgWideEmailAddress owea = [
                SELECT Id
                FROM OrgWideEmailAddress
                WHERE Address = :System.Label.OrgWideEmailAddress
                LIMIT 1
            ];
            oweaId = owea.Id;
        } catch (Exception ignore) {}

        Messaging.SingleEmailMessage msg = new Messaging.SingleEmailMessage();
        msg.setToAddresses(new String[] { recipientEmail });
        msg.setSubject(subject);
        msg.setHtmlBody(body);
        if (oweaId != null) msg.setOrgWideEmailAddressId(oweaId);

        Messaging.SendEmailResult[] ers = Messaging.sendEmail(new Messaging.SingleEmailMessage[] { msg }, false);
        if (ers != null && !ers.isEmpty() && ers[0].isSuccess()) {
            r.success = true; r.message = 'OK (ack email sent)';
        } else {
            String eMsg = (ers != null && !ers.isEmpty() && ers[0].getErrors() != null && !ers[0].getErrors().isEmpty())
                          ? ers[0].getErrors()[0].getMessage()
                          : 'Unknown email send error';
            // Still succeed the save; surface email outcome
            r.success = true; r.message = 'OK (ack email failed: ' + eMsg + ')';
        }
        return r;

    } catch (DmlException dx) {
        String msg = (dx.getNumDml() > 0) ? dx.getDmlMessage(0) : dx.getMessage();
        r.success = false; r.message = 'DML failed: ' + msg;
        return r;
    } catch (Exception ex) {
        r.success = false; r.message = 'Unexpected: ' + ex.getMessage();
        return r;
    }
}
    
    
public class ReceivedDataDTO {
        @AuraEnabled public String  payloadJson;
        @AuraEnabled public Boolean userAccountNeeded;
    }

    @AuraEnabled(cacheable=true)
    public static ReceivedDataDTO getReceivedData(Id onboardingId) {
        if (onboardingId == null) throw new AuraHandledException('onboardingId is required');

        Onboarding__c ob = [
            SELECT Id, Recieved_Data__c, User_Account_Needed__c
            FROM Onboarding__c
            WHERE Id = :onboardingId
            LIMIT 1
        ];

        ReceivedDataDTO out = new ReceivedDataDTO();
        out.payloadJson        = ob.Recieved_Data__c;
        out.userAccountNeeded  = ob.User_Account_Needed__c;
        return out;
    }

@AuraEnabled
public static SaveResultDTO approveOnboarding(Id onboardingId, Boolean userAccountNeeded, String payloadJson) {
    SaveResultDTO r = new SaveResultDTO();
    try {
        if (onboardingId == null) {
            r.success = false; r.message = 'onboardingId is required'; return r;
        }

        Onboarding__c ob = [
            SELECT Id, Status__c, Link_Active__c, User_Account_Needed__c
            FROM Onboarding__c
            WHERE Id = :onboardingId
            LIMIT 1
            FOR UPDATE
        ];

        if (ob.Status__c != 'Data Received') {
            r.success = false; r.message = 'Record is not in Data Received status'; return r;
        }

        ob.User_Account_Needed__c = (userAccountNeeded == true);
        ob.Status__c = 'Reviewed';
        ob.Link_Active__c = false;

        if (payloadJson != null) {
    
            String outJson = forceCountryAuOnly(payloadJson);

            Integer maxLen = 131000;
            if (outJson.length() > maxLen) outJson = outJson.substring(0, maxLen);
            ob.Recieved_Data__c = outJson;
        }

        update ob;

        r.success = true; r.message = 'Reviewed';
        return r;
    } catch (DmlException dx) {
        r.success = false;
        r.message = (dx.getNumDml() > 0) ? dx.getDmlMessage(0) : dx.getMessage();
        return r;
    } catch (Exception ex) {
        r.success = false; r.message = ex.getMessage();
        return r;
    }
}

private static String forceCountryAuOnly(String json) {
    if (String.isBlank(json)) return json;

    Integer addrKey = json.indexOf('"address"');
    if (addrKey < 0) return json;

    Integer braceStart = json.indexOf('{', addrKey);
    if (braceStart < 0) return json;

    Integer depth = 0;
    Integer braceEnd = -1;
    for (Integer i = braceStart; i < json.length(); i++) {
        String ch = json.substring(i, i + 1); 
        if (ch == '{') {
            depth++;
        } else if (ch == '}') {
            depth--;
            if (depth == 0) { braceEnd = i; break; }
        }
    }
    if (braceEnd < 0) return json;

    String before = json.substring(0, braceStart);
    String addrObj = json.substring(braceStart, braceEnd + 1); 
    String after  = json.substring(braceEnd + 1);

    Pattern p = Pattern.compile('(?i)"country"\\s*:\\s*\\"[^\\"]*\\"');
    Matcher m = p.matcher(addrObj);
    if (m.find()) {
        String replaced = m.replaceFirst('"country":"AU"');
        return before + replaced + after;
    }

    Boolean emptyObject = true;
    for (Integer i = braceStart + 1; i < braceEnd; i++) {
        String ch = json.substring(i, i + 1);
        if (ch.trim().length() > 0) { emptyObject = false; break; }
    }

    String insertion = '"country":"AU"';
    if (!emptyObject) insertion += ','; 

    String addrWithCountry =
        json.substring(braceStart, braceStart + 1) 
        + insertion
        + json.substring(braceStart + 1, braceEnd + 1);

    return before + addrWithCountry + after;
}


    
@AuraEnabled 
public static Map<String, Object> createAccountsContactsAndStaff(List<Map<String, String>> records) {
    System.debug(LoggingLevel.WARN, 'createAccountsContactsAndStaff: START, total incoming rows=' + (records == null ? 0 : records.size()));
    Map<String, Object> response = new Map<String, Object>();
    List<Map<String, String>> successRecords = new List<Map<String, String>>();
    List<Map<String, String>> failedRecords  = new List<Map<String, String>>();

    // --- NEW: participant summary holders ---
    Integer participantAttempted = 0;
    Integer participantCreated   = 0;
    Integer participantFailed    = 0;
    List<Map<String,String>> participantResults = new List<Map<String,String>>();
    Map<String, String> participantStatusByEmail = new Map<String, String>(); // Attempted/Created/Failed/Skipped
    Map<String, String> participantErrorByEmail  = new Map<String, String>(); // error text (if any)

    if (records == null || records.isEmpty()) {
        response.put('successRecords', successRecords);
        response.put('failedRecords', failedRecords);
        response.put('participantCreationAttemptedCount', 0);
        response.put('participantCreationCreatedCount',   0);
        response.put('participantCreationFailedCount',    0);
        response.put('participantCreationResults',        participantResults);
        return response;
    }

    try {
        User currentUser = [
            SELECT Id, Organization_Name__c, TimeZoneSidKey, LocaleSidKey, EmailEncodingKey, LanguageLocaleKey 
            FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1
        ];
        Account portalAccount = [
            SELECT Id, Name FROM Account WHERE Name = 'Portal Account' LIMIT 1
        ];

        List<Contact> contactsToInsert = new List<Contact>();
        Map<String, Integer> emailToIndexMap = new Map<String, Integer>();
        Map<String, Boolean> emailNeedsUser  = new Map<String, Boolean>();

        for (Integer i = 0; i < records.size(); i++) {
            Map<String, String> record = records[i];
            try {
                if (record == null) {
                    Map<String, String> err = new Map<String, String>();
                    err.put('ErrorMessage', 'Row is null');
                    failedRecords.add(err);
                    continue;
                }

                String email = record.get('EmailAddress');
                String statusRaw = record.get('Status');
                String status = (statusRaw == null) ? '' : statusRaw.trim();

                if (!'Reviewed'.equalsIgnoreCase(status)) {
                    record.put('ErrorMessage', 'Skipped: Status is not Reviewed');
                    failedRecords.add(record);
                    continue;
                }

                List<Contact> existing = [SELECT Id FROM Contact WHERE Email = :email LIMIT 1];
                if (!existing.isEmpty()) {
                    record.put('ErrorMessage', 'Duplicate email found (Contact already exists): ' + email);
                    failedRecords.add(record);
                    continue;
                }

                Boolean needUser = parseBooleanFlexible(record.get('UserAccountNeeded'));
                emailNeedsUser.put(email, needUser);

                Contact c = new Contact();
                c.FirstName               = record.get('FirstName');
                c.LastName                = record.get('LastName');
                c.Email                   = email;
                c.AccountId               = portalAccount.Id;
                c.MailingStreet           = record.get('AddressStreet');
                c.MailingCity             = record.get('AddressCity');
                c.MailingState            = record.get('AddressState');
                c.MailingPostalCode       = record.get('AddressPostCode');
                c.MailingCountry          = record.get('AddressCountry');
                c.Portal_User_Created__c  = needUser;

                contactsToInsert.add(c);
                emailToIndexMap.put(c.Email, i);

                participantStatusByEmail.put(email, 'Skipped'); // default

            } catch (Exception e1) {
                record.put('ErrorMessage', 'Contact creation prep failed: ' + e1.getMessage());
                failedRecords.add(record);
            }
        }

        if (!contactsToInsert.isEmpty()) {
            Database.SaveResult[] cr = Database.insert(contactsToInsert, false);
            for (Integer i = 0; i < cr.size(); i++) {
                Database.SaveResult sr = cr[i];
                Contact c = contactsToInsert[i];
                Integer srcIndex = emailToIndexMap.get(c.Email);
                Map<String, String> src = (srcIndex != null && srcIndex < records.size()) ? records[srcIndex] : new Map<String, String>();
                if (!sr.isSuccess()) {
                    String msg = firstDml(sr, 'Contact insert failed');
                    src.put('ErrorMessage', msg);
                    failedRecords.add(src);
                    emailToIndexMap.remove(c.Email);
                }
            }
        }

        List<Staff__c> staffToInsert = new List<Staff__c>();
        Map<String, Contact> contactByEmail = new Map<String, Contact>();
        for (Contact c : contactsToInsert) if (c.Id != null) contactByEmail.put(c.Email, c);

        Integer needUserCount = 0;

        // Role map + latest onboarding for JSON
        Map<String, String> onboardingRoleByEmail = new Map<String, String>();
        Map<String, Onboarding__c> latestOnbByEmail = new Map<String, Onboarding__c>();

        if (!emailToIndexMap.isEmpty()) {
            for (Onboarding__c ob : [
                SELECT Email__c, Role__c, User_Type__c, Recieved_Data__c, CreatedDate
                FROM Onboarding__c
                WHERE Email__c IN :emailToIndexMap.keySet()
                ORDER BY CreatedDate DESC
            ]) {
                if (String.isBlank(ob.Email__c)) continue;
                if (!String.isBlank(ob.Role__c) && !onboardingRoleByEmail.containsKey(ob.Email__c)) {
                    onboardingRoleByEmail.put(ob.Email__c, ob.Role__c);
                }
                if (!latestOnbByEmail.containsKey(ob.Email__c)) {
                    latestOnbByEmail.put(ob.Email__c, ob);
                }
            }
        }

        for (String email : emailToIndexMap.keySet()) {
            Integer index = emailToIndexMap.get(email);
            Map<String, String> record = records[index];

            try {
                Contact insertedContact = contactByEmail.get(email);
                if (insertedContact == null || insertedContact.Id == null) {
                    record.put('ErrorMessage', 'No inserted contact found for email ' + email);
                    failedRecords.add(record);
                    continue;
                }

                Facility__c facility = null;
                String facilityIdStr = record.get('FacilityId');
                Id facilityIdVal = null;
                if (!String.isBlank(facilityIdStr)) {
                    try { facilityIdVal = (Id) facilityIdStr; } catch (Exception ignore) {}
                }
                if (facilityIdVal != null) {
                    facility = new Facility__c(Id = facilityIdVal);
                } else {
                    String facilityName = record.get('Facility');
                    if (!String.isBlank(facilityName)) {
                        List<Facility__c> fl = [SELECT Id FROM Facility__c WHERE Name = :facilityName LIMIT 1];
                        if (!fl.isEmpty()) facility = fl[0];
                    }
                }

                if (facility == null) {
                    String facilityNameForMsg = record.get('Facility');
                    record.put('ErrorMessage', 'Facility not found: ' + facilityNameForMsg);
                    failedRecords.add(record);
                    continue;
                }

                String roledata = onboardingRoleByEmail.get(email);
                if (String.isBlank(roledata)) {
                    record.put('ErrorMessage', 'Missing Role__c on Onboarding for ' + email);
                    failedRecords.add(record);
                    continue;
                }

                Boolean active;
                String activeRaw = record.get('Active');
                if (!String.isBlank(activeRaw)) {
                    active = parseBooleanFlexible(activeRaw);
                } else {
                    // EmploymentStatus ("Active"/"Inactive")
                    String empStatus = record.get('EmploymentStatus');
                    if (!String.isBlank(empStatus)) {
                        active = empStatus.trim().equalsIgnoreCase('Active');
                    } else {
                        // Fallback: try to read employment.status from the latest onboarding JSON
                        Boolean fromJson = null;
                        Onboarding__c obForActive = latestOnbByEmail.get(email);
                        if (obForActive != null && !String.isBlank(obForActive.Recieved_Data__c)) {
                            try {
                                Map<String, Object> root = (Map<String, Object>) JSON.deserializeUntyped(obForActive.Recieved_Data__c);
                                Map<String, Object> emp  = (Map<String, Object>) root.get('employment');
                                if (emp != null) {
                                    String st = (String) emp.get('status'); // "Active" | "Inactive"
                                    if (!String.isBlank(st)) fromJson = st.trim().equalsIgnoreCase('Active');
                                }
                            } catch (Exception ignore) {}
                        }
                        if (fromJson != null) {
                            active = fromJson;
                        } else {
                            // Legacy fallback (keep previous behavior minus "Reviewed")
                            String statusWord = record.get('Status');
                            active =
                                'Active'.equalsIgnoreCase(statusWord) ||
                                'true'.equalsIgnoreCase(statusWord) ||
                                'Yes'.equalsIgnoreCase(statusWord);
                        }
                    }
                }

                Decimal hourly = safeDecimal(record.get('HourlyRate'));
                Date startDt   = safeParseDDMMYYYY(record.get('StartDate'));

                Staff__c s = new Staff__c();
                s.Name                      = insertedContact.FirstName;
                s.Last_Name__c              = insertedContact.LastName;
                s.Gender__c                 = record.get('Gender');
                s.Email_Address__c          = insertedContact.Email;
                s.Status__c                 = active;
                s.Contact_Number__c         = record.get('PhoneNumber');
                s.User_Role__c              = roledata;
                s.User_Type__c              = record.get('UserType');
                s.Facility__c               = facility.Id;
                s.Type_of_User__c           = 'NDIS User';
                s.Nationality__c = record.get('Nationality');
                s.Languages__c   = record.get('Languages');

                s.Working_Hours_Rate__c     = hourly;
                s.ABN_Number__c             = record.get('AbnNumber'); 
                s.TFN_number__c             = record.get('TaxFileNumber');
                s.Tax_free_threshold__c     = record.get('TaxFreeThreshold');
                s.Emp_Start_Date__c         = startDt;
                s.Date_Of_Birth__c          = safeParseDDMMYYYY(record.get('DateofBirth'));

                s.Address__Street__s        = record.get('AddressStreet');
                s.Address__City__s          = record.get('AddressCity');
                s.Address__StateCode__s     = record.get('AddressState');
                s.Address__PostalCode__s    = String.isBlank(record.get('AddressPostCode')) ? '3066' : record.get('AddressPostCode');
                s.Address__CountryCode__s   = String.isBlank(record.get('AddressCountry'))  ? 'AU'   : record.get('AddressCountry');

                s.TimeZoneSidKey__c         = currentUser.TimeZoneSidKey;
                s.LocaleSidKey__c           = currentUser.LocaleSidKey;
                s.EmailEncodingKey__c       = currentUser.EmailEncodingKey;
                s.LanguageLocaleKey__c      = currentUser.LanguageLocaleKey;

                // default Hourly/StartDate for Roster Manager + NDIS Participant
                String roleVal = String.isBlank(roledata) ? '' : roledata.trim();
                    String utLc    = String.isBlank(s.User_Type__c) ? '' : s.User_Type__c.trim().toLowerCase();

                    Boolean isSpecial =
                        (roleVal == 'Portal Account Partner Manager') &&
                        (utLc == 'ndis participant');

                    if (isSpecial) {
                        if (s.Working_Hours_Rate__c == null) {
                            s.Working_Hours_Rate__c = 0;
                        }
                        if (s.Emp_Start_Date__c == null) {
                            s.Emp_Start_Date__c = System.today();
                        }
                    }


                staffToInsert.add(s);

                if (emailNeedsUser.get(email) == true) {
                    needUserCount++;
                }

            } catch (Exception e2) {
                record.put('ErrorMessage', 'Staff creation prep failed: ' + e2.getMessage());
                failedRecords.add(record);
            }
        }

        // Prepare client inserts (and keep email for reporting)
        List<Client__c> clientsToInsert = new List<Client__c>();
        List<String>    clientsEmailIdx = new List<String>();

      if (!staffToInsert.isEmpty()) {
        Database.SaveResult[] srStaff = Database.insert(staffToInsert, false);

        // =======================
        // ✅ NEW: collect staff-facility mappings for ONE bulk call
        // =======================
        List<staffFacilityHandler.StaffFacilityWrapper> sfWrappers =
            new List<staffFacilityHandler.StaffFacilityWrapper>();

        Set<String> successEmails_NeedUser = new Set<String>();
        Set<String> successEmails_NoUser   = new Set<String>();

        for (Integer i = 0; i < srStaff.size(); i++) {
            Database.SaveResult sr = srStaff[i];
            Staff__c s = staffToInsert[i];
            Map<String,String> src = findSourceByEmail(records, s.Email_Address__c);

            if (sr.isSuccess()) {

                // =======================
                // ✅ NEW: add mapping staffId + facilityId(s)
                // (does NOT change existing Facility__c lookup behavior)
                // =======================
                staffFacilityHandler.StaffFacilityWrapper w =
                    new staffFacilityHandler.StaffFacilityWrapper();
                w.staffId = sr.getId();
                w.selectedFacilityIds = new List<Id>();
                if (s.Facility__c != null) {
                    w.selectedFacilityIds.add(s.Facility__c); // same facility already on Staff
                }
                sfWrappers.add(w);

                if (src != null) src.remove('ErrorMessage');

                Boolean requested = (emailNeedsUser.get(s.Email_Address__c) == true);
                if (src != null) src.put('UserCreation', requested ? 'Queued' : 'Skipped');

                if (requested) successEmails_NeedUser.add(s.Email_Address__c);
                else           successEmails_NoUser.add(s.Email_Address__c);

                // ==== Participant(Client) creation decision ====
                Onboarding__c ob = latestOnbByEmail.get(s.Email_Address__c);
                Boolean shouldCreateClient = false;
                if (ob != null && ob.Role__c != null) {
                    String roleVal = ob.Role__c.trim();
                    String ut      = String.isBlank(ob.User_Type__c) ? s.User_Type__c : ob.User_Type__c;
                    String utLc    = (ut == null) ? '' : ut.trim().toLowerCase();

                    shouldCreateClient =
                        (roleVal == 'Portal Account Partner Manager' &&
                        utLc == 'ndis participant');
                }


                if (shouldCreateClient) {
                    participantStatusByEmail.put(s.Email_Address__c, 'Attempted');
                    participantAttempted++;

                    // Parse JSON to populate Client__c (person + primaryContact)
                    String pcFirst = null, pcLast = null, pcPhone = null, pcEmail = null, pcRel = null;
                    String pFirst  = null, pLast  = null, pGender = null, pDobIso = null;
                    try {
                        if (ob != null && !String.isBlank(ob.Recieved_Data__c)) {
                            Map<String, Object> root   = (Map<String, Object>) JSON.deserializeUntyped(ob.Recieved_Data__c);
                            Map<String, Object> person = (Map<String, Object>) root.get('person');
                            Map<String, Object> pc     = (Map<String, Object>) root.get('primaryContact');

                            if (person != null) {
                                pFirst  = sVal(person.get('firstName'));
                                pLast   = sVal(person.get('lastName'));
                                pGender = sVal(person.get('gender'));
                                pDobIso = sVal(person.get('dateOfBirth'));
                                if (String.isBlank(pcEmail)) pcEmail = sVal(person.get('email'));
                            }
                            if (pc != null) {
                                pcFirst = sVal(pc.get('firstName'));
                                pcLast  = sVal(pc.get('lastName'));
                                pcPhone = sVal(pc.get('phone'));
                                String pcEmailCandidate = sVal(pc.get('email'));
                                if (!String.isBlank(pcEmailCandidate)) pcEmail = pcEmailCandidate;
                                pcRel   = sVal(pc.get('relationship'));
                            }
                        }
                    } catch (Exception ignore) {}

                    Map<String,String> srcRow = findSourceByEmail(records, s.Email_Address__c);
                    if (String.isBlank(pFirst) && srcRow != null) pFirst = srcRow.get('FirstName');
                    if (String.isBlank(pLast)  && srcRow != null) pLast  = srcRow.get('LastName');

                    Client__c cl = new Client__c();
                    cl.Name                         = safeName(pFirst, pLast);
                    cl.First_Name__c                = pFirst;
                    cl.Last_Name__c                 = pLast;
                    cl.Gendar__c                    = pGender;
                    cl.Date_Of_Birth__c             = dateFromIso(pDobIso);
                    cl.Facility__c                  = s.Facility__c;
                    cl.Contact_Number__c            = s.Contact_Number__c;

                    // --- COPY ADDRESS FROM STAFF INTO CLIENT (Address__c compound parts) ---
                    cl.Address__Street__s           = s.Address__Street__s;
                    cl.Address__City__s             = s.Address__City__s;
                    cl.Address__StateCode__s        = s.Address__StateCode__s;
                    cl.Address__PostalCode__s       = s.Address__PostalCode__s;
                    cl.Address__CountryCode__s      = s.Address__CountryCode__s;

                    // Primary contact
                    cl.Primay_Contact_First_Name__c = pcFirst;
                    cl.Primary_Name__c              = safeName(pcFirst, pcLast);
                    cl.Primary_Contact_Number__c    = pcPhone;
                    cl.Primary_Email_ID__c          = pcEmail;
                    cl.Relationship__c              = pcRel;

                    clientsToInsert.add(cl);
                    clientsEmailIdx.add(s.Email_Address__c);
                }

                successRecords.add(src);
            } else {
                if (src != null) src.put('ErrorMessage', firstDml(sr, 'Staff insert failed'));
                failedRecords.add(src);
            }
        }

        // =======================
        // ✅ NEW: one bulk call AFTER inserts and AFTER the loop
        // (wrapped in try/catch so it cannot break existing flow)
        // =======================
        if (!sfWrappers.isEmpty()) {
            try {
                staffFacilityHandler.upsertStaffFacilitiesBulk(sfWrappers);
            } catch (Exception ex) {
                System.debug(LoggingLevel.ERROR,
                    'Staff_Facility__c bulk upsert failed: ' + ex.getMessage());
            }
        }

        // Insert Clients (partial DML) + update participant status
        if (!clientsToInsert.isEmpty()) {
            Database.SaveResult[] crClients = Database.insert(clientsToInsert, false);
            for (Integer i = 0; i < crClients.size(); i++) {
                String email = clientsEmailIdx[i];
                if (crClients[i].isSuccess()) {
                    participantStatusByEmail.put(email, 'Created');
                    participantCreated++;
                    participantResults.add(new Map<String,String>{
                        'Email' => email,
                        'Status' => 'Created'
                    });
                } else {
                    String err = firstDml(crClients[i], 'Client insert failed');
                    participantStatusByEmail.put(email, 'Failed');
                    participantErrorByEmail.put(email, err);
                    participantFailed++;
                    participantResults.add(new Map<String,String>{
                        'Email' => email,
                        'Status' => 'Failed',
                        'Error' => err
                    });
                    System.debug(LoggingLevel.ERROR, 'Client__c insert failed for ' + email + ': ' + err);
                }
            }
        }

        // Flip latest Reviewed Onboarding to Created
        Set<String> successAll = new Set<String>();
        successAll.addAll(successEmails_NeedUser);
        successAll.addAll(successEmails_NoUser);

        if (!successAll.isEmpty()) {
            List<Onboarding__c> candidates = [
                SELECT Id, Email__c, Status__c, CreatedDate
                FROM Onboarding__c
                WHERE Email__c IN :successAll
                AND Status__c = 'Reviewed'
                ORDER BY CreatedDate DESC
            ];
            Map<String, Onboarding__c> latestByEmail = new Map<String, Onboarding__c>();
            for (Onboarding__c ob : candidates) {
                if (!latestByEmail.containsKey(ob.Email__c)) {
                    latestByEmail.put(ob.Email__c, ob);
                }
            }
            List<Onboarding__c> toUpd = new List<Onboarding__c>();
            for (Onboarding__c ob : latestByEmail.values()) {
                ob.Status__c = 'Created';
                toUpd.add(ob);
            }
            if (!toUpd.isEmpty()) {
                try { update toUpd; }
                catch (DmlException dx) {
                    System.debug(LoggingLevel.ERROR, 'Failed to flip Onboarding to Created: ' + dx.getMessage());
                }
            }
        }
    }


        // Push ParticipantCreation status back into row maps
        for (Map<String,String> r : successRecords) {
            String email = r.get('EmailAddress');
            if (email != null && participantStatusByEmail.containsKey(email)) {
                r.put('ParticipantCreation', participantStatusByEmail.get(email));
                if ('Failed'.equalsIgnoreCase(participantStatusByEmail.get(email)) && participantErrorByEmail.containsKey(email)) {
                    r.put('ParticipantCreationError', participantErrorByEmail.get(email));
                }
            }
        }
        for (Map<String,String> r : failedRecords) {
            String email = r.get('EmailAddress');
            if (email != null && participantStatusByEmail.containsKey(email)) {
                r.put('ParticipantCreation', participantStatusByEmail.get(email));
                if ('Failed'.equalsIgnoreCase(participantStatusByEmail.get(email)) && participantErrorByEmail.containsKey(email)) {
                    r.put('ParticipantCreationError', participantErrorByEmail.get(email));
                }
            }
        }

        // Batch user creation (unchanged)
        Id batchJobId;
        if (needUserCount > 0) {
            System.debug(LoggingLevel.WARN, 'createAccountsContactsAndStaff: Triggering CreateUsersBatch because ' + needUserCount + ' contact(s) flagged Portal_User_Created__c = true');
            batchJobId = Database.executeBatch(new CreateUsersBatch(), 1);
        } else {
            System.debug(LoggingLevel.WARN, 'createAccountsContactsAndStaff: No user accounts requested. Batch NOT triggered.');
            batchJobId = null;
        }

        response.put('successRecords', successRecords);
        response.put('failedRecords',  failedRecords);
        response.put('userCreationRequestedCount', needUserCount);
        response.put('userCreationBatchJobId', (batchJobId == null) ? null : String.valueOf(batchJobId));

        // Participant summary back to JS
        response.put('participantCreationAttemptedCount', participantAttempted);
        response.put('participantCreationCreatedCount',   participantCreated);
        response.put('participantCreationFailedCount',    participantFailed);
        response.put('participantCreationResults',        participantResults);

        System.debug(LoggingLevel.WARN,
            'createAccountsContactsAndStaff: END. success=' + successRecords.size() + ', failed=' + failedRecords.size() +
            ' | participantAttempted=' + participantAttempted + ', participantCreated=' + participantCreated + ', participantFailed=' + participantFailed);
        return response;

    } catch (Exception ex) {
        System.debug(LoggingLevel.ERROR, 'createAccountsContactsAndStaff: FATAL ' + ex.getMessage());
        throw new AuraHandledException('Error while processing records: ' + ex.getMessage());
    }
}

   
    public static Boolean eqIgnoreCase(String a, String b) {
    return a != null && b != null && a.trim().toLowerCase() == b.trim().toLowerCase();
}
public static String sVal(Object o) {
    return (o == null) ? null : String.valueOf(o);
}
public static Date dateFromIso(String iso) {
    if (String.isBlank(iso)) return null;
    try { return Date.valueOf(iso); } catch (Exception e) { return null; }
}
public static String safeName(String first, String last) {
    String f = String.isBlank(first) ? '' : first.trim();
    String l = String.isBlank(last)  ? '' : last.trim();
    String full = (f + ' ' + l).trim();
    return String.isBlank(full) ? 'Client' : full;
}


/** Helpers (same class) **/
public static Decimal safeDecimal(String s) {
    try { return (s == null || s.trim() == '') ? null : Decimal.valueOf(s); } catch (Exception e) { return null; }
}
public static Date safeParseDDMMYYYY(String input) {
    if (String.isBlank(input)) return null;
    List<String> parts = input.split('/');
    if (parts.size() != 3) return null;
    try {
        return Date.newInstance(
            Integer.valueOf(parts[2]), // year
            Integer.valueOf(parts[1]), // month
            Integer.valueOf(parts[0])  // day
        );
    } catch (Exception e) {
        return null;
    }
}
public static Boolean parseBooleanFlexible(String v) {
    if (String.isBlank(v)) return false;
    String x = v.trim().toLowerCase();
    return (x == 'true' || x == 'yes' || x == 'y' || x == '1');
}
public static String firstDml(Database.SaveResult sr, String prefix) {
    if (sr == null) return prefix + ': Unknown error';
    Database.Error[] errs = sr.getErrors();
    if (errs == null || errs.isEmpty()) return prefix + ': Unknown error';
    return prefix + ': ' + errs[0].getMessage();
}
public static Map<String,String> findSourceByEmail(List<Map<String,String>> records, String email) {
    if (String.isBlank(email)) return new Map<String,String>();
    for (Map<String,String> r : records) {
        if (r != null && email.equalsIgnoreCase(r.get('EmailAddress'))) return r;
    }
    return new Map<String,String>();
}
@AuraEnabled(cacheable=true)
public static String getOrgLogoUrlById(Id orgId) {
    if (orgId == null) return null;
    Organisation__c o = [
        SELECT Organization_Logo__c
        FROM Organisation__c
        WHERE Id = :orgId
        LIMIT 1
    ];
    return o.Organization_Logo__c;
}
    
    @AuraEnabled(cacheable=true)
public static String getFacilityManagerName(Id facilityId) {
    if (facilityId == null) return null;
    Facility__c f = [
        SELECT Manager_Name__c
        FROM Facility__c
        WHERE Id = :facilityId
        LIMIT 1
    ];
    return f.Manager_Name__c;
}

    
    public class CountDTO {
        @AuraEnabled public Integer sent;
        @AuraEnabled public Integer received;
        @AuraEnabled public Integer reviewed;
        @AuraEnabled public Integer created;
        @AuraEnabled public Integer totalInvites;
        @AuraEnabled public Integer usersCreated;
    }

    @AuraEnabled
    public static CountDTO getOnboardingCounts(Id facilityId, Id orgId) {
        CountDTO out = new CountDTO();
        out.sent = 0; out.received = 0; out.reviewed = 0; out.created = 0;
        out.totalInvites = 0; out.usersCreated = 0;

        // Guard
        if (facilityId == null) return out;

        // Common where clause
        String whereClause = 'WHERE Facility__c = :facilityId';
        if (orgId != null) {
            whereClause += ' AND Organization__c = :orgId';
        }

        // 1) Grouped status counts in ONE query
        for (AggregateResult ar : Database.query(
            'SELECT Status__c s, COUNT(Id) c ' +
            'FROM Onboarding__c ' + whereClause + ' ' +
            'GROUP BY Status__c'
        )) {
            String s = (String) ar.get('s');
            Integer c = ((Decimal) ar.get('c')).intValue();
            if (s == 'Request Sent')  out.sent = c;
            else if (s == 'Data Received') out.received = c;
            else if (s == 'Reviewed') out.reviewed = c;
            else if (s == 'Created')  out.created = c;
        }

        // 2) Total invites
        out.totalInvites = Database.countQuery(
            'SELECT COUNT() FROM Onboarding__c ' + whereClause
        );

         // 3) Users created = Onboarding rows that needed a user AND are in Created
    out.usersCreated = Database.countQuery(
        'SELECT COUNT() FROM Onboarding__c ' + whereClause +
        ' AND User_Account_Needed__c = true' +
        ' AND Status__c = \'Created\''
    );

        return out;
    }
@AuraEnabled(cacheable=true)
public static List<Onboarding__c> getEmailNotSent(Id orgId, Id facilityId, Integer maxRows) {
    Integer lim = (maxRows == null || maxRows <= 0) ? 200 : Math.min(maxRows, 2000);

    String whereClause = 'WHERE (Email_Sent__c = false OR Email_Sent__c = null)';
    if (orgId != null)      whereClause += ' AND Organization__c = :orgId';
    if (facilityId != null) whereClause += ' AND Facility__c = :facilityId';

    String soql =
        'SELECT Id, Email__c, Status__c, CreatedDate, ' +
        '       Facility__r.Name, Organization__r.Name, Email_Sent_Last_Error__c ' +
        'FROM Onboarding__c ' + whereClause +
        ' ORDER BY CreatedDate DESC ' +
        ' LIMIT :lim';

    return Database.query(soql);
}

 public class OnboardingInfo {
        @AuraEnabled public String role;
        @AuraEnabled public String userType;
        @AuraEnabled public Id     facilityId;
        @AuraEnabled public String facilityName;
        @AuraEnabled public Id     orgId;
        @AuraEnabled public String orgName;
    }

    @AuraEnabled(cacheable=true)
    public static OnboardingInfo getOnboardingRoleAndUserType(Id onboardingId) {
        if (onboardingId == null) {
            throw new AuraHandledException('onboardingId is required');
        }

        // Query the fields you need
        List<Onboarding__c> recs = [
            SELECT Role__c, User_Type__c,
                   Facility__c, Facility__r.Name,
                   Organization__c, Organization__r.Name
            FROM Onboarding__c
            WHERE Id = :onboardingId
            LIMIT 1
        ];
        if (recs.isEmpty()) {
            throw new AuraHandledException('Onboarding record not found');
        }

        // Enforce FLS for guest/portal users
        SObjectAccessDecision d = Security.stripInaccessible(
            AccessType.READABLE, recs
        );
        List<Onboarding__c> safe = (List<Onboarding__c>) d.getRecords();
        if (safe.isEmpty()) {
            throw new AuraHandledException('Access denied to requested record.');
        }

        Onboarding__c ob = safe[0];
        OnboardingInfo out = new OnboardingInfo();
        out.role        = ob.Role__c;
        out.userType    = ob.User_Type__c;
        out.facilityId  = ob.Facility__c;
        out.facilityName= ob.Facility__r != null ? ob.Facility__r.Name : null;
        out.orgId       = ob.Organization__c;
        out.orgName     = ob.Organization__r != null ? ob.Organization__r.Name : null;
        return out;
    }
    
    
    @AuraEnabled
public static Map<String, String> getExistingEmails(List<String> emails) {
    Map<String, String> result = new Map<String, String>();
    if (emails == null || emails.isEmpty()) return result;

    // unique original values to use in SOQL IN clause
    Set<String> needles = new Set<String>();
    for (String e : emails) {
        if (e != null) {
            String t = e.trim();
            if (t != null && t != '') needles.add(t);
        }
    }
    if (needles.isEmpty()) return result;

    // User.Email
    for (User u : [
        SELECT Email
        FROM User
        WHERE Email != null AND Email IN :needles
        LIMIT 50000
    ]) {
        String k = u.Email == null ? null : u.Email.trim().toLowerCase();
        if (k != null && k != '') result.put(k, 'User');
    }

    // Staff__c.Email_Address__c
    for (Staff__c s : [
        SELECT Email_Address__c
        FROM Staff__c
        WHERE Email_Address__c != null AND Email_Address__c IN :needles
        LIMIT 50000
    ]) {
        String k = s.Email_Address__c == null ? null : s.Email_Address__c.trim().toLowerCase();
        if (k != null && k != '') result.put(k, 'Staff__c');
    }

    // Client__c.Email__c
    for (Client__c c : [
        SELECT Email__c
        FROM Client__c
        WHERE Email__c != null AND Email__c IN :needles
        LIMIT 50000
    ]) {
        String k = c.Email__c == null ? null : c.Email__c.trim().toLowerCase();
        if (k != null && k != '') result.put(k, 'Client__c');
    }

    // Onboarding__c.Email__c
    for (Onboarding__c o : [
        SELECT Email__c
        FROM Onboarding__c
        WHERE Email__c != null AND Email__c IN :needles
        LIMIT 50000
    ]) {
        String k = o.Email__c == null ? null : o.Email__c.trim().toLowerCase();
        if (k != null && k != '') result.put(k, 'Onboarding__c');
    }

    return result;
}
    
public class OnboardingSaveResult {
        @AuraEnabled public Boolean success;
        @AuraEnabled public String  message;
        public OnboardingSaveResult(Boolean s, String m) {
            success = s;
            message = m;
        }
    }

    @AuraEnabled
    public static OnboardingSaveResult updateOnboardingJsonR(Id onboardingId, String payloadJson) {
        try {
            if (onboardingId == null) {
                return new OnboardingSaveResult(false, 'onboardingId is required');
            }

            Onboarding__c ob = [
                SELECT Id, Recieved_Data__c
                FROM Onboarding__c
                WHERE Id = :onboardingId
                LIMIT 1
            ];

            ob.Recieved_Data__c = payloadJson;
            update ob;

            return new OnboardingSaveResult(true, null);
        } catch (Exception e) {
            return new OnboardingSaveResult(false, e.getMessage());
        }
    }

}