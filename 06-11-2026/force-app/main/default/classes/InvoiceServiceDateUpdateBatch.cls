public without sharing class InvoiceServiceDateUpdateBatch implements Database.Batchable<SObject> {

    // ---------- START: all organisations ----------
    public Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator([
            SELECT Id, Name, Accounting_Services__c
            FROM Organisation__c
            WHERE Accounting_Services__c != null
        ]);
    }

    // ---------- EXECUTE: one organisation at a time (batch size 1) ----------
    public void execute(Database.BatchableContext bc, List<Organisation__c> scope) {

        List<SObject> childrenToUpdate = new List<SObject>();
        List<SObject> parentsToUpdate = new List<SObject>();

        for (Organisation__c org : scope) {

            String accountingService = org.Accounting_Services__c;
            System.debug('Organisation: ' + org.Name + ' | Accounting Service: ' + accountingService);

            List<SObject> invoices;
            String childRelationship;

            // 1. Pick the approach for this organisation
            if (accountingService == 'Tesseract System') {

                childRelationship = 'Accounting_Journal_Entry__r';
                invoices = [
                    SELECT Id,Name, Services_Id_List__c,Participant__c,
                        (SELECT Id,Name, Line_Items__c, Description__c,Sl_no__c,Unit_Price__c,Quantity__c,Tax__c
                         FROM Accounting_Journal_Entry__r
                         WHERE Unit_Price__c != null AND Quantity__c != null AND Tax__c != null AND Description__c!= null
                         ORDER BY Sl_no__c ASC NULLS LAST)
                    FROM Accounting_Invoices_Expenses__c
                    WHERE Is_Service_Invoice__c = true
                    AND Company__r.Organization__c = :org.Id                  
                ];

            } else if (accountingService == 'Xero' || accountingService == 'MYOB') {

                childRelationship = 'Xero_Invoice_Entries__r';
                invoices = [
                    SELECT Id,Name, Services_Id_List__c,Participant__c,
                        (SELECT Id,Name,Sl_no__c, Line_Items__c, Description__c,Unit_Price__c,Quantity__c,Tax__c
                         FROM Xero_Invoice_Entries__r
                         WHERE Unit_Price__c != null AND Quantity__c != null AND Description__c!= null
                         ORDER BY Sl_no__c ASC NULLS LAST)
                    FROM Xero_or_Myob_Invoice__c
                    WHERE Is_Service_Invoice__c = true
                    AND Participant__r.Facility__r.Organisation__c = :org.Id    
                ];

            } else {
                System.debug('Unknown accounting service, skipped: ' + accountingService);
                continue;
            }

            if (invoices.isEmpty()) continue;

            for (SObject inv : invoices) {

				List<SObject> children = inv.getSObjects(childRelationship);
                if (children == null) continue;

                Date startDate = null;
                Date endDate = null;

                // 2. Child: read the date from its own description
                for (SObject child : children) {
                    Date serviceDate = getDateFromDescription((String) child.get('Description__c'));
                    if (serviceDate == null) {
                        System.debug('No date found in description of row ' + child.Id);
                        continue;
                    }

                    SObject childUpd = child.getSObjectType().newSObject(child.Id);
                    childUpd.put('Service_Date__c', serviceDate);
                    childrenToUpdate.add(childUpd);
					
                    System.debug('Child: ' + child.get('Name') + ' | Invoice: ' + inv.get('Name')
                    + ' | Service_Date__c = ' + serviceDate.format());
                    if (startDate == null || serviceDate < startDate) startDate = serviceDate;
                    if (endDate == null || serviceDate > endDate) endDate = serviceDate;
                }

                // 3. Parent: earliest = start, latest = end
                if (startDate != null) {
                    SObject parentUpd = inv.getSObjectType().newSObject(inv.Id);
                    parentUpd.put('Service_Start_Date__c', startDate);
                    parentUpd.put('Service_End_Date__c', endDate);
                    parentsToUpdate.add(parentUpd);
                    
                    System.debug('Invoice: ' + inv.get('Name')
                    + ' | Service_Start_Date__c = ' + startDate.format()
                    + ' | Service_End_Date__c = ' + endDate.format());
                }
            }
        }

        // 4. Save once, after all organisations in scope
        if (!childrenToUpdate.isEmpty()) Database.update(childrenToUpdate, false);
        if (!parentsToUpdate.isEmpty()) Database.update(parentsToUpdate, false);

        System.debug('Children updated: ' + childrenToUpdate.size() + ', invoices updated: ' + parentsToUpdate.size());
    }

    // ---------- FINISH ----------
    public void finish(Database.BatchableContext bc) {
        System.debug('Service date backfill completed for all organisations.');
    }

    // "... on 29/1/2027 from ..." or "Cancelled Shift – 29/1/2027 (...)" → Date(2027, 1, 29)
    private static Date getDateFromDescription(String description) {
        if (String.isBlank(description)) return null;

        Matcher m = Pattern.compile('(\\d{1,2})/(\\d{1,2})/(\\d{4})').matcher(description);
        if (!m.find()) return null;

        Integer day = Integer.valueOf(m.group(1));
        Integer month = Integer.valueOf(m.group(2));
        Integer year = Integer.valueOf(m.group(3));

        if (month < 1 || month > 12 || day < 1 || day > Date.daysInMonth(year, month)) return null;

        return Date.newInstance(year, month, day);
    }
}