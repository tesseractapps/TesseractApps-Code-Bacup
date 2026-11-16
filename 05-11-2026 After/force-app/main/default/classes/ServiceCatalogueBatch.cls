global class ServiceCatalogueBatch implements Database.Batchable<SObject> {

    public static Integer totalRecordsCreated = 0;

    global Database.QueryLocator start(Database.BatchableContext bc) {
        System.debug('================ START METHOD ================');
        System.debug('Preparing QueryLocator for Active Service Catalogue records.');

        return Database.getQueryLocator([
            SELECT
                Id,
                Name,
                CreatedDate,
                Facility__c,
                Facility__r.Id,
                Facility__r.Name,
                Active__c,
                NDIS_Support_Catalogue__c,
                NDIS_Support_Catalogue__r.Id,
                NDIS_Support_Catalogue__r.Name,
                NDIS_Support_Catalogue__r.Facility__c,
                NDIS_Support_Catalogue__r.Facility__r.Id,
                NDIS_Support_Catalogue__r.Facility__r.Name,
                NDIS_Support_Catalogue__r.Support_Item_Number__c
            FROM Service_Catalogue__c
            WHERE Active__c = true
        ]);
    }

    global void execute(Database.BatchableContext bc, List<Service_Catalogue__c> scope) {

        System.debug('================ EXECUTE METHOD START ================');
        System.debug('Scope Size : ' + scope.size());

        String financialYear = getCurrentFinancialYear();
        System.debug('Current Financial Year: ' + financialYear);

        Set<String> supportItemNumbers = new Set<String>();

        for (Service_Catalogue__c serviceCat : scope) {
            if (serviceCat.NDIS_Support_Catalogue__r != null &&
                String.isNotBlank(serviceCat.NDIS_Support_Catalogue__r.Support_Item_Number__c)) {
                supportItemNumbers.add(serviceCat.NDIS_Support_Catalogue__r.Support_Item_Number__c);
            }
        }

        System.debug('Unique Support Item Numbers found in scope: ' + supportItemNumbers.size());

        if (supportItemNumbers.isEmpty()) {
            System.debug('No valid Support Item Numbers found in scope.');
            System.debug('================ EXECUTE METHOD END ================');
            return;
        }

        List<NDIS_Support_Catalogue__c> ndisSupportCatalogues = [
            SELECT
                Id,
                Name,
                Support_Item_Number__c,
                Support_Item_Name__c,
                Facility__c,
                Facility__r.Id,
                Facility__r.Name,
                Financial_Year__c,
                CreatedDate,
                LastModifiedDate
            FROM NDIS_Support_Catalogue__c
            WHERE Support_Item_Number__c IN :supportItemNumbers
            AND Financial_Year__c = :financialYear
        ];

        System.debug('NDIS Support Catalogues found for Financial Year ' + financialYear + ': ' + ndisSupportCatalogues.size());

        if (ndisSupportCatalogues.isEmpty()) {
            System.debug('No current FY NDIS records found.');
            System.debug('================ EXECUTE METHOD END ================');
            return;
        }

        Map<String, NDIS_Support_Catalogue__c> ndisByItemNumber = new Map<String, NDIS_Support_Catalogue__c>();
        for (NDIS_Support_Catalogue__c ndis : ndisSupportCatalogues) {
            if (String.isNotBlank(ndis.Support_Item_Number__c)) {
                ndisByItemNumber.put(ndis.Support_Item_Number__c, ndis);
            }
        }

        List<Service_Catalogue__c> newServiceCatalogues = new List<Service_Catalogue__c>();

        for (Service_Catalogue__c serviceCat : scope) {
            if (serviceCat.NDIS_Support_Catalogue__r == null) {
                continue;
            }

            String itemNumber = serviceCat.NDIS_Support_Catalogue__r.Support_Item_Number__c;

            if (String.isBlank(itemNumber)) {
                continue;
            }

            if (serviceCat.Facility__c == null) {
                continue;
            }

            if (ndisByItemNumber.containsKey(itemNumber)) {
                NDIS_Support_Catalogue__c matchedNdis = ndisByItemNumber.get(itemNumber);

                Service_Catalogue__c newServiceCat = new Service_Catalogue__c();
                newServiceCat.Facility__c = serviceCat.Facility__c;
                newServiceCat.NDIS_Support_Catalogue__c = matchedNdis.Id;
                newServiceCat.Active__c = true;

                newServiceCatalogues.add(newServiceCat);
            }
        }

        System.debug('New Service Catalogue records to create: ' + newServiceCatalogues.size());

        if (!newServiceCatalogues.isEmpty()) {
            try {
                Database.SaveResult[] results = Database.insert(newServiceCatalogues, false);
                Integer successCount = 0;

                for (Database.SaveResult sr : results) {
                    if (sr.isSuccess()) {
                        successCount++;
                    } else {
                        for (Database.Error err : sr.getErrors()) {
                            System.debug('Insert error: ' + err.getMessage());
                        }
                    }
                }

                totalRecordsCreated += successCount;
                System.debug('Successfully inserted records: ' + successCount);
                System.debug('Total records created so far: ' + totalRecordsCreated);

            } catch (Exception e) {
                System.debug('ERROR inserting Service Catalogue records: ' + e.getMessage());
                System.debug('Stack Trace: ' + e.getStackTraceString());
            }
        } else {
            System.debug('No Service Catalogue records to insert.');
        }

        System.debug('================ EXECUTE METHOD END ================');
    }

    global void finish(Database.BatchableContext bc) {
        System.debug('================ FINISH METHOD ================');
        System.debug('TOTAL RECORDS CREATED: ' + totalRecordsCreated);
        System.debug('Batch execution completed.');
    }

    public String getCurrentFinancialYear() {
        Date today = Date.today();
        Integer startYear;
        Integer endYear;

        if (today.month() >= 7) {
            startYear = today.year();
            endYear = today.year() + 1;
        } else {
            startYear = today.year() - 1;
            endYear = today.year();
        }

        String financialYear = startYear + '-' + String.valueOf(endYear).right(2);
        System.debug('Calculated Financial Year: ' + financialYear);

        return financialYear;
    }
}