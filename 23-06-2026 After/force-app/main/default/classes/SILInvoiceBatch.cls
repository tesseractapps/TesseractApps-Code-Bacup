public class SILInvoiceBatch implements Database.Batchable<SObject>, Database.AllowsCallouts,Database.Stateful {
    
    private static final String AWS_ENDPOINT = System.Label.SILEndPointURL;
    public List<Id> invoiceIds = new List<Id>();
    public List<String> errorLogs = new List<String>();
    public Database.QueryLocator start(Database.BatchableContext bc) {
        System.debug('🚀 BATCH START METHOD');
        return Database.getQueryLocator([
            SELECT Id, Name, Organisation__c,Address__Street__s,Address__City__s,Address__PostalCode__s,Address__StateCode__s,   
            Organisation__r.Name,
            Organisation__r.ABN__c,
            Organisation__r.Email__c,
            Organisation__r.Contact_No__c,
            Organisation__r.Logo__c,
            Organisation__r.Accounting_Services__c,Organisation__r.Bank__c,Organisation__r.BSB__c,Organisation__r.Account_Number__c,Organisation__r.Account_Name__c
            FROM Facility__c
        ]);
    }
    
    public void execute(Database.BatchableContext bc, List<Facility__c> scope) {
        
        System.debug('🚀 BATCH EXECUTE STARTED');
        
        if (scope.isEmpty()) {
            System.debug('❌ Scope empty');
            return;
        }
        
        String ENV = System.Label.Environment_Label;
        String generatedAt = DateTime.now().formatGmt('yyyy-MM-dd\'T\'HH:mm:ss\'Z\'');
        
        Set<Id> facilityIds = new Set<Id>();
        for (Facility__c f : scope) facilityIds.add(f.Id);
        
        System.debug('📌 Facilities Count: ' + facilityIds.size());
        
        Map<Id, Id> facilityToCompanyMap = new Map<Id, Id>();
        for (Company__c comp : [
            SELECT Id, Facility__c FROM Company__c WHERE Facility__c IN :facilityIds
        ]) {
            facilityToCompanyMap.put(comp.Facility__c, comp.Id);
        }
        
        List<Client__c> participants = [
            SELECT Id, Name__c, NDIS_Participant_ID__c, Facility__c,Address__Street__s,Address__City__s,Address__PostalCode__s,Address__StateCode__s,Date_Of_Birth__c
            FROM Client__c
            WHERE Id IN (SELECT Participant__c FROM Participant_Facility__c WHERE Facility__c = :facilityIds AND Active__c = true ) AND Status__c = true
        ];
        
        System.debug('👥 Participants Count: ' + participants.size());
        
        Map<Id, List<Client__c>> facParMap = new Map<Id, List<Client__c>>();
        Set<Id> participantIds = new Set<Id>();
        
        for (Client__c p : participants) {
            participantIds.add(p.Id);
            if (!facParMap.containsKey(p.Facility__c)) {
                facParMap.put(p.Facility__c, new List<Client__c>());
            }
            facParMap.get(p.Facility__c).add(p);
        }
        
        List<SIL__c> silRecords = [
            SELECT Id, SIL_To_Participant__c,
            ServiceType__c, Plan_Type__c,
            Amount__c, InvoiceAmount__c, Remaining_Amount__c,
            Last_Invoice_Date__c, InvoiceDay__c, Frequency__c,
            StartDate__c, EndDate__c,
            Entity_Name__c, Entity_Profile__r.Accounting_Ledger_Items__c,Spent_Amount__c,
            (SELECT SupportItem_Name__c, SupportItem_Number__c
             FROM SIL_Items__r WHERE Status__c = true)
            FROM SIL__c
            WHERE SIL_To_Participant__c IN :participantIds
            AND Status__c = 'Active'
        ];
        
        System.debug('📄 SIL Records Count: ' + silRecords.size());
        
        Map<Id, List<SIL__c>> parSILMap = new Map<Id, List<SIL__c>>();
        Map<Id, SIL__c> silMap = new Map<Id, SIL__c>();
        
        for (SIL__c sil : silRecords) {
            silMap.put(sil.Id, sil);
            if (!parSILMap.containsKey(sil.SIL_To_Participant__c)) {
                parSILMap.put(sil.SIL_To_Participant__c, new List<SIL__c>());
            }
            parSILMap.get(sil.SIL_To_Participant__c).add(sil);
        }
        
        List<Accounting_Invoices_Expenses__c> invoiceList = new List<Accounting_Invoices_Expenses__c>();
        Map<Id, Accounting_Invoices_Expenses__c> silToInvoiceMap = new Map<Id, Accounting_Invoices_Expenses__c>();
        
        Map<Id, Map<String, Object>> orgMap = new Map<Id, Map<String, Object>>();
        
        for (Facility__c fac : scope) {
            
            List<Client__c> facPars = facParMap.get(fac.Id);
            if (facPars == null) continue;
            
            List<Object> participantList = new List<Object>();
            
            for (Client__c par : facPars) {
                
                List<SIL__c> sils = parSILMap.get(par.Id);
                if (sils == null) continue;
                
                List<Object> serviceList = new List<Object>();
                
                for (SIL__c sil : sils) {
                    
                    if (!shouldGenerateInvoice(sil)) {
                        System.debug('⛔ Skipping SIL: ' + sil.Id);
                        continue;
                    }
                    
                    System.debug('✅ Processing SIL: ' + sil.Id);
                    
                    List<Object> itemList = new List<Object>();
                    for (SIL_Items__c item : sil.SIL_Items__r) {
                        itemList.add(new Map<String, Object>{
                            'supportItemNumber' => item.SupportItem_Number__c,
                                'description' => item.SupportItem_Name__c
                                });
                    }
                    
                    if (itemList.isEmpty()) continue;
                    
                    Accounting_Invoices_Expenses__c inv = new Accounting_Invoices_Expenses__c(
                        Invoice_Date__c = Date.today(),
                        Status__c = 'Issued',
                        Company__c = facilityToCompanyMap.get(fac.Id),
                        Entity_Type__c = 'Invoice',
                        GST__c = 0,
                        Total_Amount__c = sil.InvoiceAmount__c,
                        Sub_Total__c = sil.InvoiceAmount__c,
                        Participant__c = par.Id,
                        Is_Sill_Invoice__c = true,
                        Services_Id_List__c = sil.Id
                    );
                    
                    invoiceList.add(inv);
                    silToInvoiceMap.put(sil.Id, inv);
                    
                    serviceList.add(new Map<String, Object>{
                        'serviceId' => sil.Id,
                            'serviceType' => sil.ServiceType__c,
                            'planType' => sil.Plan_Type__c,
                            'amount' => sil.Amount__c,
                            'invoiceAmount' => sil.InvoiceAmount__c,
                            'startDate' => sil.StartDate__c != null ? sil.StartDate__c.format() : null,
                                'endDate' => sil.EndDate__c != null ? sil.EndDate__c.format() : null,
                                    'items' => itemList
                                    });
                }
                
                if (!serviceList.isEmpty()) {
                    participantList.add(new Map<String, Object>{
                        'participantId' => par.Id,
                            'name' => par.Name__c,
                            'ndisNumber' => par.NDIS_Participant_ID__c,
                            'services' => serviceList,
                            'address' =>
                            (par.Address__Street__s != null ? par.Address__Street__s + ', ' : '') +
                            (par.Address__City__s != null ? par.Address__City__s + ', ' : '') +
                            (par.Address__StateCode__s != null ? par.Address__StateCode__s + ' ' : '') +
                            (par.Address__PostalCode__s != null ? par.Address__PostalCode__s : '')
                            
                            
                            });
                }
            }
            
            if (!participantList.isEmpty()) {
                
                if (!orgMap.containsKey(fac.Organisation__c)) {
                    
                    orgMap.put(fac.Organisation__c, new Map<String, Object>{
                        'organisationId'   => fac.Organisation__c,
                            'organisationName' => fac.Organisation__r.Name,
                            'abn'              => fac.Organisation__r.ABN__c,
                            'Street'           =>  fac.Address__Street__s,
                            'cityandpostal'    => fac.Address__City__s +' '+ fac.Address__StateCode__s+','+ fac.Address__PostalCode__s,
                            
                            'email'            => fac.Organisation__r.Email__c,
                            'phone'            => fac.Organisation__r.Contact_No__c,
                            'logoUrl'          => fac.Organisation__r.Logo__c,
                            'BSB'              => fac.Organisation__r.BSB__c,
                            'Accountname'      => fac.Organisation__r.Account_Name__c,  
                            'Accountnumber'   => fac.Organisation__r.Account_Number__c,
                            'Bank'            => fac.Organisation__r.Bank__c,
                            
                            'facilities'       => new List<Object>()
                            });
                }
                
                ((List<Object>)orgMap.get(fac.Organisation__c).get('facilities')).add(
                    new Map<String, Object>{
                        'facilityId'   => fac.Id,
                            'facilityName' => fac.Name,
                            'participants' => participantList 
                            
                            }
                );
            }
        }
        
        if (orgMap.isEmpty()) {
            System.debug('❌ No data to send to AWS');
            return;
        }
        
        String jsonBody = JSON.serialize(new Map<String, Object>{
            'env' => ENV,
                'generatedAt' => generatedAt,
                'organisations' => orgMap.values()
                });
        
        System.debug('📦 PAYLOAD: ' + JSON.serializePretty(orgMap));
        
        String boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
        
        String body =
            '--' + boundary + '\r\n' +
            'Content-Disposition: form-data; name="file"; filename="payload.json"\r\n' +
            'Content-Type: application/json\r\n\r\n' +
            jsonBody + '\r\n' +
            '--' + boundary + '--';
        
        HttpRequest req = new HttpRequest();
        req.setEndpoint(AWS_ENDPOINT);
        req.setMethod('POST');
        req.setHeader('Content-Type', 'multipart/form-data; boundary=' + boundary);
        req.setBodyAsBlob(Blob.valueOf(body));
        req.setTimeout(120000);
        
        System.debug('🌐 Sending request to AWS...');
        
        //HttpResponse res = new Http().send(req);
        HttpResponse res;
        try {
            res = new Http().send(req);
        } catch (Exception e) {
            String msg = 'AWS Callout Failed: ' + e.getMessage();
            System.debug('❌ ' + msg);
            errorLogs.add(msg);
            return; // stop this chunk safely
        }
        System.debug('🌐 AWS STATUS: ' + res.getStatusCode());
        System.debug('🌐 AWS RESPONSE: ' + res.getBody());
        if (res.getStatusCode() != 200) {
            String msg = 'AWS Bad Response: ' + res.getStatusCode() + ' | Body: ' + res.getBody();
            System.debug('❌ ' + msg);
            errorLogs.add(msg);
            return; // stop further processing
        }
        Map<String, Object> responseMap = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
        List<Object> results = (List<Object>) responseMap.get('results');
        
        List<SIL__c> silToUpdate = new List<SIL__c>();
        
        if (results != null) {
            for (Object resObj : results) {
                Map<String, Object> resMap = (Map<String, Object>) resObj;
                
                for (Object facObj : (List<Object>) resMap.get('facilities')) {
                    for (Object parObj : (List<Object>) ((Map<String, Object>) facObj).get('participants')) {
                        for (Object servObj : (List<Object>) ((Map<String, Object>) parObj).get('services')) {
                            
                            Map<String, Object> servMap = (Map<String, Object>) servObj;
                            
                            Id silId = (Id)((String)servMap.get('serviceId'));
                            String invoiceNo = (String) servMap.get('invoiceNumber');
                            String url = (String) servMap.get('pdf_url');
                            
                            System.debug('🧾 Mapping Invoice for SIL: ' + silId);
                            
                            if (silToInvoiceMap.containsKey(silId)) {
                                
                                Accounting_Invoices_Expenses__c inv = silToInvoiceMap.get(silId);
                                inv.Invoice_No__c = invoiceNo;
                                //  inv.Amazon_URL__c = url;
                                inv.SIL_PDF_Url__c =url;
                                SIL__c sil = silMap.get(silId);
                                
                                Decimal previousSpent = sil.Spent_Amount__c != null ? sil.Spent_Amount__c : 0;
                                
                                // 🚫 Prevent overbilling (extra safety)
                                if (previousSpent + sil.InvoiceAmount__c > sil.Amount__c) {
                                    System.debug('⛔ Skipping due to over-consumption: ' + sil.Id);
                                    continue;
                                }
                                
                                // ✅ Update spent
                                Decimal newSpent = previousSpent + sil.InvoiceAmount__c;
                                sil.Spent_Amount__c = newSpent;
                                
                                // ✅ Derive remaining (DO NOT decrement)
                                sil.Remaining_Amount__c = sil.Amount__c - newSpent;
                                
                                // ✅ Update last invoice date
                                sil.Last_Invoice_Date__c = Date.today();
                                
                                // ✅ Close record if fully consumed
                                if (sil.Remaining_Amount__c <= 0) {
                                    sil.Status__c = 'Inactive';
                                }
                                
                                silToUpdate.add(sil);
                                
                                System.debug('💰 Updated Remaining: ' + sil.Remaining_Amount__c);
                            }
                        }
                    }
                }
            }
        }
        
        if (!invoiceList.isEmpty()) {
            // insert invoiceList;
            Database.SaveResult[] InVresults = Database.insert(invoiceList, false);
            for (Integer i = 0; i < InVresults.size(); i++) {
                if (!InVresults[i].isSuccess()) {
                    for (Database.Error err : InVresults[i].getErrors()) {
                        String msg = 'Invoice Insert Failed | Record: ' + invoiceList[i] + ' | Error: ' + err.getMessage();
                        System.debug('❌ ' + msg);
                        errorLogs.add(msg);
                    }
                }
            }
            // ─────────────────────────────────────────────
            // CREATE JOURNAL ENTRIES AFTER INVOICE INSERT
            // ─────────────────────────────────────────────
            
            List<Accounting_Journal_Entry__c> journalEntriesToInsert = new List<Accounting_Journal_Entry__c>();
            
            for (Id silId : silToInvoiceMap.keySet()) {
                
                Accounting_Invoices_Expenses__c inv = silToInvoiceMap.get(silId);
                SIL__c sil = silMap.get(silId);
                
                if (inv == null || sil == null || sil.SIL_Items__r == null) continue;
                
                Integer sno = 1;
                
                for (SIL_Items__c item : sil.SIL_Items__r) {
                    
                    Accounting_Journal_Entry__c journal = new Accounting_Journal_Entry__c(
                        Tax_Amount__c = 0,
                        Total_Amount__c = 0,
                        Sub_Total__c = 0,
                        Description__c = item.SupportItem_Name__c,
                        Entry_Type__c = 'Sales',
                        Entity_Profile_Name__c = sil.Entity_Name__c,
                        Line_Items__c = item.SupportItem_Number__c,
                        Unit_Price__c = 0,
                        Quantity__c = 0,
                        Tax__c = 0,
                        Sl_no__c = sno,
                        Invoice_Date__c = sil.StartDate__c,
                        Company__c = inv.Company__c,
                        Amount__c = 0,
                        Tax_Inclusive__c = true,
                        Accounting_Ledger_Items__c = sil.Entity_Profile__r.Accounting_Ledger_Items__c,
                        Row_Unique_ID__c =
                        String.valueOf(DateTime.now().getTime()).right(10) +
                        String.valueOf(Math.abs(Crypto.getRandomInteger())).right(10),
                        Accounting_Invoices_Expenses__c = inv.Id
                    );
                    
                    journalEntriesToInsert.add(journal);
                    sno++;
                }
            }
            
            // INSERT JOURNALS
            if (!journalEntriesToInsert.isEmpty()) {
                insert journalEntriesToInsert;
                System.debug('✅ Journal Entries Inserted: ' + journalEntriesToInsert.size());
            }
            // List<Id> invoiceIds = new List<Id>();
            
            //for (Accounting_Invoices_Expenses__c inv : invoiceList) {
             //   invoiceIds.add(inv.Id);
            //}
            for (Integer i = 0; i < InVresults.size(); i++) {
    if (InVresults[i].isSuccess()) {
        invoiceIds.add(invoiceList[i].Id);
    }
}
 
            System.debug('✅ Invoices Inserted: ' + invoiceList.size());
        }
        
        if (!silToUpdate.isEmpty()) {
            //update silToUpdate;
            Database.SaveResult[] updateResults = Database.update(silToUpdate, false);
            for (Integer i = 0; i < updateResults.size(); i++) {
                if (!updateResults[i].isSuccess()) {
                    for (Database.Error err : updateResults[i].getErrors()) {
                        String msg = 'SIL Update Failed | Record: ' + silToUpdate[i].Id + ' | Error: ' + err.getMessage();
                        System.debug('❌ ' + msg);
                        errorLogs.add(msg);
                    }
                }
            }
            System.debug('✅ SIL Updated: ' + silToUpdate.size());
        }
        
        System.debug('🏁 BATCH EXECUTION COMPLETED');
    }
    
    public void finish(Database.BatchableContext bc) {
        
        System.debug('🏁 BATCH FINISH METHOD');
        System.debug('📧 Total invoices to email: ' + invoiceIds.size());
        if (!errorLogs.isEmpty()) {
            
            String body = 'Batch Completed with Errors\n\n';
            body += 'Total Failures: ' + errorLogs.size() + '\n\n';
            
            for (String err : errorLogs) {
                body += err + '\n';
            }
            
            Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
            mail.setToAddresses(new List<String>{'pasalapudi.manendrasai@tesseractapps.com'}); // update
            mail.setSubject('🚨 SIL Invoice Batch Failures');
            mail.setPlainTextBody(body);
            
            Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{mail});
            
            System.debug('📧 Failure email sent');
        }
        if (!invoiceIds.isEmpty()) {
            System.enqueueJob(new SendInvoiceEmailQueueable(invoiceIds));
            System.debug('🚀 Queueable triggered ONCE');
        } else {
            System.debug('❌ No invoices to send');
        }
    }
    
    private Boolean shouldGenerateInvoice(SIL__c sil) {
        
        Date today = Date.today();
        
        if (sil.Remaining_Amount__c == null || sil.InvoiceAmount__c == null) return false;
        if (sil.Remaining_Amount__c <= 0) return false;
        if (sil.Remaining_Amount__c < sil.InvoiceAmount__c) return false;
        
        if (today < sil.StartDate__c || today > sil.EndDate__c) return false;
        
        if (sil.Frequency__c == 'Monthly') {
            if (sil.Last_Invoice_Date__c != null &&
                today < sil.Last_Invoice_Date__c.addMonths(1)) return false;
        } else {
            String todayDay = System.now().format('EEEE');
            if (todayDay != sil.InvoiceDay__c) return false;
            
            Integer gap = sil.Frequency__c == 'Weekly' ? 7 : 14;
            if (sil.Last_Invoice_Date__c != null &&
                sil.Last_Invoice_Date__c.daysBetween(today) < gap) return false;
        }
        
        return true;
    }
}