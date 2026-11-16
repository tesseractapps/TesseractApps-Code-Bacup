public class ServiceSupportPlanEntityBatch implements Database.Batchable<SObject> {

    public Database.QueryLocator start(Database.BatchableContext bc) {

        return Database.getQueryLocator([

            SELECT
                Id,
                Funds_Tracker__c,
                Service_Type__c,
                Date_of_Service__c,
                Entity_Profile__c,
                Xero_Entity__c,
                ShiftwithStaff__r.Shift_Facility__r.Organisation__c,
                ShiftwithStaff__r.Add_Shift__r.Facility__r.Organisation__c

            FROM Services_and_Support_Plan__c

            WHERE
                SIL_Service__c = false
                AND Funds_Tracker__c != null
                AND Service_Type__c != null
                AND Date_of_Service__c != null
				AND Entity_Profile__c = null
				AND Xero_Entity__c = null
                AND Status__c != 'Invoice Generated'
				// AND (
				// 	ShiftwithStaff__r.Shift_Facility__c = 'a02Bo00000DuJbZIAV'
				// 	OR
				// 	ShiftwithStaff__r.Add_Shift__r.Facility__c = 'a02Bo00000DuJbZIAV'
				// )

        ]);

    }

    public void execute(
        Database.BatchableContext bc,
        List<Services_and_Support_Plan__c> scope
    ) {

        Set<Id> organisationIds = new Set<Id>();
        Set<Id> fundTrackerIds = new Set<Id>();
        Set<Id> supportCatalogueIds = new Set<Id>();
        Set<String> financialYears = new Set<String>();

        Map<Id,String> serviceFinancialYearMap =new Map<Id,String>();
        for (Services_and_Support_Plan__c service : scope) {
            fundTrackerIds.add(service.Funds_Tracker__c);
            supportCatalogueIds.add(service.Service_Type__c);
            
            Integer year = service.Date_of_Service__c.year();
            String financialYear;
            if (service.Date_of_Service__c.month() >= 7) {
                financialYear =
                    year + '-' +
                    String.valueOf(year + 1).right(2);
            }
            else {
                financialYear =
                    (year - 1) + '-' +
                    String.valueOf(year).right(2);
            }
            financialYears.add(financialYear);

            serviceFinancialYearMap.put(
                service.Id,
                financialYear
            );

            Id organisationId = null;
            if (service.ShiftwithStaff__r != null) {
                // First Priority
                if (service.ShiftwithStaff__r.Shift_Facility__r != null) {
                    organisationId =
                        service.ShiftwithStaff__r
                            .Shift_Facility__r
                            .Organisation__c;
                }
                // Second Priority
                else if (
                    service.ShiftwithStaff__r.Add_Shift__r != null &&
                    service.ShiftwithStaff__r
                        .Add_Shift__r
                        .Facility__r != null
                ) {

                    organisationId =
                        service.ShiftwithStaff__r
                            .Add_Shift__r
                            .Facility__r
                            .Organisation__c;
                }
            }
            if (organisationId != null) {
                organisationIds.add(organisationId);
            }
        }

        Map<Id,Organisation__c> organisationMap = new Map<Id,Organisation__c>([
                SELECT
                    Id,
                    Accounting_Services__c
                FROM Organisation__c
                WHERE Id IN :organisationIds
            ]);

        Map<String,ClientFundTrackerJN__c> clientFundTrackerMap = new Map<String,ClientFundTrackerJN__c>();

        for (
            ClientFundTrackerJN__c cft :
            [
                SELECT
                    Id,
                    Funds_Tracker__c,
                    NDIS_Support_Catalogue__c,
                    Financial_Year__c,
                    Entity_Profile__c,
                    Xero_Entity__c,
                    NDIS_Support_Catalogue__r.Is_Government__c,
                    NDIS_Support_Catalogue__r.Financial_Year__c

                FROM ClientFundTrackerJN__c
                WHERE
                    Funds_Tracker__c IN :fundTrackerIds
                    AND NDIS_Support_Catalogue__c IN :supportCatalogueIds
                    //AND Financial_Year__c  IN :financialYears
                    AND (
                        Financial_Year__c IN :financialYears
                        OR (
                            NDIS_Support_Catalogue__r.Is_Government__c = FALSE
                            AND NDIS_Support_Catalogue__r.Financial_Year__c = NULL
                        ))] ) {   String key = cft.Funds_Tracker__c + '_' + cft.NDIS_Support_Catalogue__c; if (String.isNotBlank(cft.Financial_Year__c)) { key += '_' + cft.Financial_Year__c;
            } clientFundTrackerMap.put( key, cft);
        }
        List<Services_and_Support_Plan__c> updateList = new List<Services_and_Support_Plan__c>();
		for (Services_and_Support_Plan__c service : scope) {
		
            Id organisationId = null;
            // First Priority - Shift Facility
            if (service.ShiftwithStaff__r != null && service.ShiftwithStaff__r.Shift_Facility__r != null) {organisationId =service.ShiftwithStaff__r.Shift_Facility__r .Organisation__c;
            }
            // Second Priority - Add Shift Facility
            else if (
                service.ShiftwithStaff__r != null &&
                service.ShiftwithStaff__r.Add_Shift__r != null &&
                service.ShiftwithStaff__r
                    .Add_Shift__r
                    .Facility__r != null
            ) {
                organisationId =
                    service.ShiftwithStaff__r
                        .Add_Shift__r
                        .Facility__r
                        .Organisation__c;
            }

            if (organisationId == null) {continue;
            }
            if (!organisationMap.containsKey(organisationId)) {
                continue;
            }

            String accountingService =
                organisationMap.get(organisationId)
                    .Accounting_Services__c;

            if (String.isBlank(accountingService)) {
                continue;
            }

            String financialYear = serviceFinancialYearMap.get(service.Id);
            String key =
                service.Funds_Tracker__c +
                '_' +
                service.Service_Type__c +
                '_' +
                financialYear;

            // if (!clientFundTrackerMap.containsKey(key)) {
            //     continue;
            // }

            ClientFundTrackerJN__c cft =clientFundTrackerMap.get(key);
            if (cft == null) {
                String nonGovtKey =
                    service.Funds_Tracker__c + '_' +
                    service.Service_Type__c;

                cft = clientFundTrackerMap.get(nonGovtKey);
            }

            if (cft == null) {
                continue;
            }if (cft.Entity_Profile__c == null &&cft.Xero_Entity__c == null) {continue;
			} Boolean isUpdated = false; if (accountingService == 'Tesseract System') {if (service.Entity_Profile__c != cft.Entity_Profile__c) {service.Entity_Profile__c = cft.Entity_Profile__c; isUpdated = true;
                }
            }
            else if (accountingService == 'Xero' || accountingService == 'MYOB') {
                if (service.Xero_Entity__c !=cft.Xero_Entity__c) {
                    service.Xero_Entity__c = cft.Xero_Entity__c;
                    isUpdated = true;
                }
            }

            if (isUpdated) {
                updateList.add(service);
            }
        }

        if (!updateList.isEmpty()) {
            update updateList;
            System.debug( 'Updated Services : ' + updateList.size());
        }
    }

    public void finish(
        Database.BatchableContext bc
    ) {
        System.debug(
            'ServiceSupportEntityBatch Completed Successfully.'
        );
    }
}