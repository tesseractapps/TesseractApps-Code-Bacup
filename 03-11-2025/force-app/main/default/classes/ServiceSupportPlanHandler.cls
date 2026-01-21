/**
* @description       : 
* @author            : Raja Sekhar Reddy
* @group             : 
* @last modified on  : 06-18-2023
* @last modified by  : Raja Sekhar Reddy
**/
public with sharing class ServiceSupportPlanHandler {
    
    //Nagendra implemented Lookup related Functionality
    
    @AuraEnabled(cacheable=true)
    public static List<Staff__c> getResourceName(String ResouceName)
    {
        return [select id, NameToDisplay__c from Staff__c];        
    }
    
    @AuraEnabled(cacheable=false)
    public static String fetchSupId(String recordId){
        New_Support_Plan__c newSupPlan = new New_Support_Plan__c();
        newSupPlan.Client__c=recordId;
        insert newSupPlan;
        return newSupPlan.Id;
    }
    
    @AuraEnabled(cacheable=false)
    public static List<ContentDocumentLink> fetchFiles(String recordId){
        List<String> supList = new List<String>();
        for(New_Support_Plan__c listAttachment : [select id,Client__c from New_Support_Plan__c where Client__c=:recordId]){
            supList.add(listAttachment.id);
        }
        
        return [SELECT LinkedEntityId, ContentDocument.CreatedDate, ContentDocument.Title, ContentDocument.ContentSize, ContentDocument.FileType 
                FROM ContentDocumentLink  
                WHERE LinkedEntityId  In : supList];
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Services_and_Support_Plan__c> serviceSupportList(String clientId, String sDate, String eDate) {
        if (String.isBlank(clientId)) {
            return new List<Services_and_Support_Plan__c>();
        }
        
        String query = 'SELECT Id, Service_Users__c, Resource_Name__c, Service_Type_Name__c, Lineitem__c, Support_Item_Name__c,Service_Type__c, ShiftwithStaff__r.Status__c,State__c,' +
            'Date_of_Service__c, Qty__c, Unit_Price__c, GST__c, Amount__c, Status__c, Available_Funds__c, ' +
            'Available_Fund__c, Client__c, Funds_Tracker__c FROM Services_and_Support_Plan__c WHERE Client__c = :clientId and Un_Assigned_Service__c =false';
        
        Date startDate = !String.isBlank(sDate) ? Date.valueOf(sDate) : null;
        Date endDate = !String.isBlank(eDate) ? Date.valueOf(eDate) : null;
        
        if (startDate != null && endDate != null) {
            query += ' AND Date_of_Service__c >= :startDate AND Date_of_Service__c <= :endDate';
        }
        
        query += ' ORDER BY CreatedDate DESC';
        
        return Database.query(query);
    }

    
    //method added by prashanth on 28-10-2024
    @AuraEnabled(cacheable=true)
    public static List<Services_and_Support_Plan__c> getServicesAndSupportPlans(Id clientId) {
        system.debug('client id'+clientId);
        return [SELECT Id, Resource_Name__c, Date_of_Service__c, Qty__c, Start_Time__c, End_Time__c,start_datetime__c,end_datetime__c,Service_Type_Name__c 
                FROM Services_and_Support_Plan__c 
                WHERE Client__c = :clientId];
    }
   
    @AuraEnabled
    public static List<Services_and_Support_Plan__c> getServicesAndSupportPlansByDate(Id clientId, string datePicker) {
        system.debug('client id'+clientId);
        Date startDate = Date.valueOf(datePicker) -30 ;
        Date endDate = Date.valueOf(datePicker)+30;
        
        
        return [SELECT Id, Resource_Name__c, Date_of_Service__c, Qty__c, Start_Time__c, End_Time__c,start_datetime__c,end_datetime__c,Service_Type_Name__c,ShiftwithStaff__r.Add_Shift__r.Shift_Name__c 
                FROM Services_and_Support_Plan__c  
                WHERE Client__c = :clientId AND Date_of_Service__c >= :startDate  AND Date_of_Service__c <= :endDate and  ShiftwithStaff__r.Attendence__c=true  ];
    }
    
    @AuraEnabled
    public static string createSupportRecord(String serviceNameValue,String serviceStatusValue,string state,string startTime,string endTime,
                                             String serviceStartDateValue, String recordId,string fundID,string staffID,string selectedNdisIdValue,string duartion,string shiftWithStaffId,string ShiftList){
                                                 try{
                                                     ShiftWrapper shift = (ShiftWrapper) JSON.deserialize(ShiftList,ShiftWrapper.class);
                                                     system.debug('shift times '+shift);
                                                     System.debug('serviceStartDateValue '+serviceStartDateValue);
                                                     Services_and_Support_Plan__c serviceRec = new Services_and_Support_Plan__c();
                                                     serviceRec.Services__c=serviceNameValue;
                                                     serviceRec.Funds_Tracker__c=fundID;
                                                     serviceRec.Service_Users__c=staffID;           
                                                     serviceRec.Status__c=serviceStatusValue;
                                                     if(String.isNotBlank(serviceStartDateValue)){
                                                         serviceRec.Date_of_Service__c=Date.valueOf(serviceStartDateValue);   
                                                     }
                                                     serviceRec.Client__c=recordId;
                                                     serviceRec.State__c=state;
                                                     serviceRec.Start_Time__c=shift.startTime;
                                                     serviceRec.End_Time__c=shift.endTime;
                                                     serviceRec.Service_Type__c=selectedNdisIdValue;
                                                     serviceRec.Qty__c=decimal.valueof(duartion);
                                                     servicerec.ShiftwithStaff__c=shiftWithStaffId;
                                                     insert serviceRec; 
                                                     return 'Service Type Is Created Successfully';
                                                 }catch(exception e){
                                                     throw new AuraHandledException(e.getMessage());
                                                 }
                                             }
    
    @AuraEnabled
    public static list<Services_and_Support_Plan__c> getSupportData(List<String> SPIdList){
        system.debug('SPIdList>>'+SPIdList);
        /*Set<Id> ServiceId= New Set<id>();
for(Services_and_Support_Plan__c sp : SPIdList){                
ServiceId.add(sp.Id);
}*/
        //return [SELECT Id, Name, Lineitem__c,Description__c,Service_Users__c,Resource_Name__c,Service_Type_Name__c,Support_Item_Name__c,Date_of_Service__c, Qty__c,Unit_Price__c,Amount__c,GST__c FROM Services_and_Support_Plan__c where id =:ServiceId];
        return [SELECT  Service_Users__c,Resource_Name__c,Lineitem__c,Description__c, Qty__c,Unit_Price__c,Amount__c,GST__c,Client__r.Facility_Name__c ,Client__r.Name__c,Client__r.Facility__r.Address__Street__s,Client__c, Client__r.First_Name__c, Client__r.Last_Name__c,
               Client__r.Picture__c,Date_of_Service__c,Available_Fund__c, Organization_ABN__c,Facility_Address__c,State__c,Status__c FROM Services_and_Support_Plan__c where id =:SPIdList];
        
    }
    
    @AuraEnabled
    public static List<Funds_Tracker__c> getClientFunds(string clientId){
        return [
            SELECT Id, Registration_Group__c, Amount_approved__c, Spent_Amt__c,
            Available_Funds__c, Plan_Type__c, Service_Type__c, Shift_Name__c
            FROM Funds_Tracker__c
            WHERE Client__c = :clientId
            AND Status__c = 'Active'
        ];
    }
    
    
    @AuraEnabled
    public static List<NDIS_Support_Catalogue__c> getNDISServiceItemNames(string sNDISServiceItemNames){
        return [select Support_Item_Name__c from NDIS_Support_Catalogue__c where Name=:sNDISServiceItemNames ];
    }
    
        
    @AuraEnabled
    public static List<Service_Invoice__c> getInvoices(string clientId )
    {
        Date d =System.Today();
        List<Service_Invoice__c> invoices =[select id,Name,Date_of_Invoice__c,User_Name__c,Amazon_Service_URL__c,Service_Ids__c,createddate from Service_Invoice__c where Participant__c =:clientId Order by createddate desc];
        for(Service_Invoice__c inv: invoices){
            date invDate =inv.CreatedDate.date(); 
            
            if(d.isSameDay(invDate) && string.isNotBlank(inv.Amazon_Service_URL__c) && string.isNotBlank(inv.Service_Ids__c) ){                
                List<string> serviceIds=inv.Service_Ids__c.split(',');
                system.debug('in if'+serviceIds);
                updateServiceStatus(serviceIds);
            }
        }
        return invoices;
    } 
    
    @AuraEnabled
    public static void updateServiceStatus(List<string> selectedIds){
        system.debug('Selected Services id>>'+selectedIds);    
        List<Services_and_Support_Plan__c> updateService =  new List<Services_and_Support_Plan__c>();
        for(string spId : selectedIds){
            Services_and_Support_Plan__c sp = New Services_and_Support_Plan__c();
            sp.id=spId;
            sp.Status__c='Invoice Generated';
            updateService.add(sp);
        }        
        System.debug('List services>>>'+updateService);
        if(updateService.size()>0){
            database.update(updateService,false);
        }      
    }
    
    @AuraEnabled
    public static List<NDIS_Support_Catalogue__c> getNDISServiceLineItem(string ServiceItemNames,string ServiceDate){//
        date sDate=date.valueof(ServiceDate);
        Integer inputYear  =  sDate.year();
        Integer currentFinancialYearStart;
        
        // Check if today is before or after the start of the financial year
        if (sDate < Date.newInstance(inputYear , 7, 1)) {
            currentFinancialYearStart = inputYear  - 1; // If input is before July 1st, the financial year started last year
        } else {
            currentFinancialYearStart = inputYear ; // If input is after June 30th, the financial year started this year
        }
        
        Date financialStartDate = Date.newInstance(currentFinancialYearStart, 7, 1); 
        system.debug('service name '+ServiceItemNames);
        system.debug('final date '+date.valueof(financialStartDate)); 
        string serviceName =ServiceItemNames+'%' ; 
        return [select Id,Name,Support_Item_Name__c,Start_Date__c,ACT__c,NSW__c,NT__c,QLD__c,SA__c,TAS__c,VIC__c,WA__c,Support_Item_Number__c from NDIS_Support_Catalogue__c where Name LIKE :serviceName
                AND Start_Date__c=:date.valueof(financialStartDate) ];// AND Start_Date__c=:financialStartDate
    }
    @AuraEnabled
    public static List<Service_Invoice__c> getInvoiceListInPayroll(string orgId,string sDate,string eDate){
        Date startDate=Date.valueOf(sDate);
        Date endDate=Date.valueOf(eDate);
        list <Service_Invoice__c> serviceInvoice =[select id,Name,Date_of_Invoice__c,Date_Format__c,User_Name__c,Amazon_Service_URL__c,Service_Ids__c,createddate,File_Name__c,Description__c,GST__c,Total_GST__c,Amount__c,Is_Service_Invoice__c,Status__c from Service_Invoice__c where Participant__r.Facility__r.Organisation__c =:orgId and Date_of_Invoice__c >=: startDate and Date_of_Invoice__c <=:endDate   Order by createddate desc];//Amount__c
        return serviceInvoice;
    }
    @AuraEnabled(cacheable = true)
    public static list<Services_and_Support_Plan__c> getServicesByShift(string shiftStaffId){
        if (String.isEmpty(shiftStaffId) || shiftStaffId == null) {
            return new List<Services_and_Support_Plan__c>();
        }
        list<Services_and_Support_Plan__c> serviceList=[ SELECT Id,Services__c,State__c, Service_Users__c,Service_Users__r.picture__c,Service_Users__r.Name, Resource_Name__c, Service_Type_Name__c, Lineitem__c,Support_Item_Name__c, Date_of_Service__c,Qty__c,Unit_Price__c,Edited_Unit_Price__c,GST__c,Amount__c,Status__c,Available_Funds__c,Available_Fund__c,ShiftwithStaff__c,Participant_Name__c,Client__c,Service_Type__c,Funds_Tracker__c,Funds_Tracker__r.Registration_Group__c,Start_Time_24_Format__c,End_Time_24_Format__c,Start_Time_Formula__c,End_Time_Formula__c,Custom_Shift_Reference_Id__c FROM Services_and_Support_Plan__c where ShiftwithStaff__c=:shiftStaffId and Un_Assigned_Service__c=false  order by createddate ASC ];
        return serviceList;
    }
    @AuraEnabled
    public static list<Services_and_Support_Plan__c> getServicesByDate(string participantId,string startDate){
        if (String.isEmpty(participantId) || participantId == null || startDate==null || String.isEmpty(startDate) ) {
            return new List<Services_and_Support_Plan__c>();
        }
        list<Services_and_Support_Plan__c> serviceList=[ SELECT Id,Services__c,State__c, Service_Users__c,Service_Users__r.picture__c,Service_Users__r.Name, Resource_Name__c, Service_Type_Name__c, Lineitem__c,Support_Item_Name__c, Date_of_Service__c,Qty__c,Unit_Price__c,GST__c,Amount__c,Status__c,Available_Funds__c,Available_Fund__c,ShiftwithStaff__c,Participant_Name__c,Client__c,Service_Type__c,Funds_Tracker__c,Start_Time_24_Format__c,ShiftwithStaff__r.Shiftcolor__c,ShiftwithStaff__r.Add_Shift__r.Shift_Name__c,ShiftwithStaff__r.Add_Shift__r.Facility__c,
                                                        ShiftwithStaff__r.Attendence__c,ShiftwithStaff__r.Status__c,Assigned_Service__c,ShiftwithStaff__r.Role_formula__c,Un_Assigned_Service__c,End_Time_24_Format__c,Start_Time_Formula__c,End_Time_Formula__c,ShiftwithStaff__r.Add_Shift__r.Location__Street__s,ShiftwithStaff__r.Add_Shift__r.Location__City__s,ShiftwithStaff__r.Add_Shift__r.Facility_Name__c,ShiftwithStaff__r.Add_Shift__r.Shift_Notes__c FROM Services_and_Support_Plan__c where Client__c=:participantId and Date_of_Service__c=:date.valueof(startDate) order by createddate ASC ];
        return serviceList;
    }
    
    
    //method added by Saran on 17-02-2025
    public class ShiftWrapper {
        public String id;
        public String startTime;
        public String endTime;
        public string addShiftId;
        public date startDate;
        public date endDate;
    }
    
    // Wrapper class to hold the data
   /* public class ServiceAndSupportPlanWrapper {
        @AuraEnabled public Id servicePlanId;
        @AuraEnabled public String computedResourceName;
        @AuraEnabled public String serviceType;
        @AuraEnabled public Date dateOfService;
        @AuraEnabled public Decimal qty;
        @AuraEnabled public string startDatetime;
        @AuraEnabled public string endDatetime;
        
        // Constructor with correct parameter types
        public ServiceAndSupportPlanWrapper(Id servicePlanId, String computedResourceName, String serviceType, Date dateOfService, Decimal qty, string startDatetime, string endDatetime string typeofShift) {
            this.servicePlanId = servicePlanId;
            this.computedResourceName = computedResourceName;
            this.serviceType = serviceType;
            this.dateOfService = dateOfService;
            this.qty = qty;
            this.startDatetime = startDatetime;
            this.endDatetime = endDatetime;
            this.typeofShift = typeofShift;
        }
    }
    @AuraEnabled(cacheable=true)
    public static List<ServiceAndSupportPlanWrapper> getServicesAndSupportPlansforDashboard(List<Id> recordId) {
        System.debug('recordId: ' + recordId);
        
        // Query all Users in bulk, and create a map of email to userId
        List<User> userList = [SELECT Id, Email,User_Type__c FROM User WHERE Id IN :recordId];
        
        if (userList.isEmpty()) {
            throw new AuraHandledException('No users found');
        }
        
        // Create a map for fast lookups by email
        Map<String, User> emailToUserMap = new Map<String, User>();
        for (User u : userList) {
            emailToUserMap.put(u.Email, u);
        }
        
        // Query for matching Client__c records based on user emails
        List<Client__c> participantList = [SELECT Id, Email__c, Name FROM Client__c WHERE Email__c IN :emailToUserMap.keySet()];
        
        // Query for matching Staff__c records based on user emails
        List<Staff__c> staffList = [SELECT Id, Email_Address__c, Name, Last_Name__c FROM Staff__c WHERE Email_Address__c IN :emailToUserMap.keySet()];
        
        // Create maps to store the corresponding Ids
        Map<String, Id> clientEmailToIdMap = new Map<String, Id>();
        for (Client__c client : participantList) {
            clientEmailToIdMap.put(client.Email__c, client.Id);
        }
        
        Map<String, Id> staffEmailToIdMap = new Map<String, Id>();
        for (Staff__c staff : staffList) {
            staffEmailToIdMap.put(staff.Email_Address__c, staff.Id);
        }
        
        // Initialize a list to collect the ServiceAndSupportPlanWrapper records to return
        List<ServiceAndSupportPlanWrapper> result = new List<ServiceAndSupportPlanWrapper>();
        
        // Retrieve Services_and_Support_Plan__c records for the given client or staff Ids
        List<Services_and_Support_Plan__c> servicesAndSupportPlans = [
            SELECT Id, Resource_Name__c, Date_of_Service__c, Qty__c, Start_Time__c, End_Time__c, start_datetime__c, end_datetime__c,ShiftwithStaff__r.Type_of_shift__c, 
            Service_Type_Name__c, Client__r.Name, Service_Users__r.Name, Service_Users__r.Last_Name__c, Client__c, Service_Users__c
            FROM Services_and_Support_Plan__c
            WHERE (Client__c IN :clientEmailToIdMap.values() OR Service_Users__c IN :staffEmailToIdMap.values()) AND Date_of_Service__c = TODAY
        ];
        
        // Loop through the results and add them to the wrapper list
        for (Services_and_Support_Plan__c plan : servicesAndSupportPlans) {
            List<String> resourceNames = new List<String>();
            
            // Check whether the record is from Client or Service User and set the Resource Name accordingly
            if (plan.Client__c != null && plan.Client__r != null) {
                if(userList[0].User_Type__c == 'NDIS Org Admin' || userList[0].User_Type__c == 'Roster Manager' || userList[0].User_Type__c == 'NDIS Staff'){
                    resourceNames.add(plan.Client__r.Name); // Standard Name field
                }else if(userList[0].User_Type__c == 'NDIS Participants'){
                    resourceNames.add(plan.Service_Users__r.Name + ' ' + plan.Service_Users__r.Last_Name__c); // Add Staff Name
                }
                System.debug('resourceName (Client) ==> ' + resourceNames);
            }
            // Join names with a line break (\n) to display each name on a new line
            String resourceName = String.join(resourceNames, '\n');
            
            // Create and add the wrapper object to the result list
            result.add(new ServiceAndSupportPlanWrapper(
                plan.Id, 
                resourceName,
                plan.Service_Type_Name__c, 
                plan.Date_of_Service__c, 
                plan.Qty__c, 
                plan.start_datetime__c, 
                plan.end_datetime__c,
                plan.ShiftwithStaff__r.Type_of_shift__c
            ));
        }
        
        // Return the result list
        return result;
    }*/
    
    
    public class ServiceAndSupportPlanWrapper {
    @AuraEnabled public Id servicePlanId;
    @AuraEnabled public String computedResourceName;
    @AuraEnabled public String serviceType;
    @AuraEnabled public Date dateOfService;
    @AuraEnabled public Decimal qty;
    @AuraEnabled public String startDatetime;
    @AuraEnabled public String endDatetime;
    @AuraEnabled public String typeofShift;

    // ✅ Correct constructor
    public ServiceAndSupportPlanWrapper(
        Id servicePlanId, 
        String computedResourceName, 
        String serviceType, 
        Date dateOfService, 
        Decimal qty, 
        String startDatetime, 
        String endDatetime,
        String typeofShift
    ) {
        this.servicePlanId = servicePlanId;
        this.computedResourceName = computedResourceName;
        this.serviceType = serviceType;
        this.dateOfService = dateOfService;
        this.qty = qty;
        this.startDatetime = startDatetime;
        this.endDatetime = endDatetime;
        this.typeofShift = typeofShift;
    }   
}
    
    @AuraEnabled(cacheable=true)
    public static List<ServiceAndSupportPlanWrapper> getServicesAndSupportPlansforDashboard(List<Id> recordId) {
        System.debug('recordId: ' + recordId);

        // Get users based on passed IDs
        List<User> userList = [SELECT Id, Email, User_Type__c FROM User WHERE Id IN :recordId];

        if (userList.isEmpty()) {
            throw new AuraHandledException('No users found');
        }

        // Map user emails for fast lookup
        Map<String, User> emailToUserMap = new Map<String, User>();
        for (User u : userList) {
            emailToUserMap.put(u.Email, u);
        }

        // Query Clients by email
        List<Client__c> participantList = [
            SELECT Id, Email__c, Name 
            FROM Client__c 
            WHERE Email__c IN :emailToUserMap.keySet()
        ];

        // Query Staff by email
        List<Staff__c> staffList = [
            SELECT Id, Email_Address__c, Name, Last_Name__c 
            FROM Staff__c 
            WHERE Email_Address__c IN :emailToUserMap.keySet()
        ];

        // Create maps to find Client or Staff IDs
        Map<String, Id> clientEmailToIdMap = new Map<String, Id>();
        for (Client__c client : participantList) {
            clientEmailToIdMap.put(client.Email__c, client.Id);
        }

        Map<String, Id> staffEmailToIdMap = new Map<String, Id>();
        for (Staff__c staff : staffList) {
            staffEmailToIdMap.put(staff.Email_Address__c, staff.Id);
        }

        List<ServiceAndSupportPlanWrapper> result = new List<ServiceAndSupportPlanWrapper>();

        // Query Services and Support Plans for today
        List<Services_and_Support_Plan__c> servicesAndSupportPlans = [
            SELECT Id, Resource_Name__c, Date_of_Service__c, Qty__c, Start_Time__c, End_Time__c,
                   start_datetime__c, end_datetime__c, ShiftwithStaff__r.Type_of_shift__c,
                   Service_Type_Name__c, Client__r.Name, Service_Users__r.Name, Service_Users__r.Last_Name__c,
                   Client__c, Service_Users__c
            FROM Services_and_Support_Plan__c
            WHERE (Client__c IN :clientEmailToIdMap.values() 
                OR Service_Users__c IN :staffEmailToIdMap.values()) 
                AND Date_of_Service__c = TODAY
        ];

        for (Services_and_Support_Plan__c plan : servicesAndSupportPlans) {
            List<String> resourceNames = new List<String>();

            // Choose name display logic based on user type (using first user only)
            if (!userList.isEmpty() && userList[0].User_Type__c != null) {
                String userType = userList[0].User_Type__c;

                if (plan.Client__c != null && plan.Client__r != null &&
                    (userType == 'NDIS Org Admin' || userType == 'Roster Manager' || userType == 'NDIS Staff')) {
                    resourceNames.add(plan.Client__r.Name);
                } else if (plan.Service_Users__c != null && plan.Service_Users__r != null &&
                           userType == 'NDIS Participants') {
                    resourceNames.add(plan.Service_Users__r.Name + ' ' + plan.Service_Users__r.Last_Name__c);
                }
            }

            String resourceName = String.join(resourceNames, '\n');

            result.add(new ServiceAndSupportPlanWrapper(
                plan.Id,
                resourceName,
                plan.Service_Type_Name__c,
                plan.Date_of_Service__c,
                plan.Qty__c,
                plan.start_datetime__c != null ? String.valueOf(plan.start_datetime__c) : null,
                plan.end_datetime__c != null ? String.valueOf(plan.end_datetime__c) : null,
                plan.ShiftwithStaff__r != null ? plan.ShiftwithStaff__r.Type_of_shift__c : null
            ));
        }

        return result;
    }

   /* @AuraEnabled
    public static void insertClientFundTrackerLinks(Id fundTrackerId,Id participantId,List<Id> selectedCatalogIds,String state, Decimal amount) {
        List<ClientFundTrackerJN__c> junctionRecords = new List<ClientFundTrackerJN__c>();
        
        for (Id catalogId : selectedCatalogIds) {
            junctionRecords.add(new ClientFundTrackerJN__c(
                Funds_Tracker__c = fundTrackerId,
                Participant__c = participantId,
                NDIS_Support_Catalogue__c = catalogId,
                State__c = state,
                Amount__c = amount
            ));
        }
        
        if (!junctionRecords.isEmpty()) {
            insert junctionRecords;
        }
    } */
    
    @AuraEnabled
    public static void insertClientFundTrackerLinks(
        Id fundTrackerId,
        Id participantId,
        List<Id> selectedCatalogIds,
        String state,
        Map<Id, Id> catalogToJunctionMap,
        Map<String, Object> serviceMetaMap
    ) {
        System.debug('🔹 START insertClientFundTrackerLinks');
        System.debug('➡ fundTrackerId: ' + fundTrackerId);
        System.debug('➡ participantId: ' + participantId);
        System.debug('➡ state: ' + state);
        System.debug('➡ selectedCatalogIds: ' + JSON.serialize(selectedCatalogIds));
        System.debug('➡ catalogToJunctionMap: ' + JSON.serialize(catalogToJunctionMap));
        System.debug('➡ serviceMetaMap: ' + JSON.serialize(serviceMetaMap));
        
        List<ClientFundTrackerJN__c> junctionRecords = new List<ClientFundTrackerJN__c>();
        
        for (Id catalogId : selectedCatalogIds) {
            Decimal amount = 0;
            String serviceSupportItem = null;
            
            String key = String.valueOf(catalogId);
            System.debug('🔍 Processing catalogId=' + catalogId + ' | lookupKey=' + key);
            
            if (serviceMetaMap != null && serviceMetaMap.containsKey(key)) {
                Object metaObj = serviceMetaMap.get(key);
                System.debug('   ↳ Found metaObj for key ' + key + ': ' + JSON.serialize(metaObj));
                
                // force cast via deserializeUntyped to avoid type mismatch
                Map<String, Object> meta = (Map<String, Object>) JSON.deserializeUntyped(JSON.serialize(metaObj));
                
                if (meta.containsKey('amount') && meta.get('amount') != null) {
                    try {
                        amount = Decimal.valueOf(String.valueOf(meta.get('amount')));
                    } catch (Exception e) {
                        System.debug('   ⚠ Error parsing amount for ' + key + ': ' + e.getMessage());
                    }
                }
                
                if (meta.containsKey('serviceSupportItem') && meta.get('serviceSupportItem') != null) {
                    serviceSupportItem = String.valueOf(meta.get('serviceSupportItem'));
                }
            }

            
            System.debug('   ✅ Resolved values -> amount=' + amount + ', serviceSupportItem=' + serviceSupportItem);
            
            ClientFundTrackerJN__c record = new ClientFundTrackerJN__c(
                Funds_Tracker__c          = fundTrackerId,
                Participant__c            = participantId,
                NDIS_Support_Catalogue__c = catalogId,
                State__c                  = state,
                Amount__c                 = amount,
                Edited_Catelog_Name__c    = serviceSupportItem
            );
            
            if (catalogToJunctionMap != null && catalogToJunctionMap.containsKey(catalogId)) {
                Id junctionId = catalogToJunctionMap.get(catalogId);
                System.debug('   🔗 junctionId for catalogId ' + catalogId + ': ' + junctionId);
                if (junctionId != null) {
                    record.Id = junctionId;
                }
            }
            
            junctionRecords.add(record);
        }
        
        System.debug('📦 Final junctionRecords before upsert: ' + JSON.serialize(junctionRecords));
        
        if (!junctionRecords.isEmpty()) {
            upsert junctionRecords;
            System.debug('✅ Upsert completed. Count=' + junctionRecords.size());
        } else {
            System.debug('⚠ No records to upsert.');
        }
        
        System.debug('🔹 END insertClientFundTrackerLinks');
    }


    
}