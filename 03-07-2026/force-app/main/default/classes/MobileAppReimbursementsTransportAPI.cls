@RestResource(urlMapping='/ReimbursementsTransportAPI/*')
global with sharing class MobileAppReimbursementsTransportAPI {

    // 🔹 Wrapper Classes
    global class ParticipantWrapper {
        public Id participantId;
        public String participantName;
    }

    global class ServiceWrapper {
        public Id serviceId;
        public String serviceName;
        public Id participantId;
    }

    global class TransportWrapper {
        public Id recordId;
        public String itemName;
        public Decimal amount;
        public Id participantId;
        public String itemNumber;
    }

    global class ResponseWrapper {
        public List<ParticipantWrapper> participants;
        public Map<Id, List<ServiceWrapper>> participantServices;
        public Map<Id, List<TransportWrapper>> participantTransportItems;
    }

    @HttpGet
    global static void getShiftData() {

        RestResponse res = RestContext.response;
        Map<String, Object> responseMap = new Map<String, Object>();

        try {

            RestRequest req = RestContext.request;
            String shiftStaffId = req.params.get('shiftwithstaffId');

            if (String.isBlank(shiftStaffId)) {
                throw new AuraHandledException('shiftwithstaffId is required');
            }

            ResponseWrapper response = new ResponseWrapper();
            response.participants = new List<ParticipantWrapper>();
            response.participantServices = new Map<Id, List<ServiceWrapper>>();
            response.participantTransportItems = new Map<Id, List<TransportWrapper>>();

            // 🔹 1. Get Services
            List<Services_and_Support_Plan__c> services =
                ServiceSupportPlanHandler.getServicesByShiftImperative(shiftStaffId);

            Map<Id, String> participantMap = new Map<Id, String>();

            for (Services_and_Support_Plan__c svc : services) {

                if (svc.Client__c == null) continue;

                participantMap.put(svc.Client__c, svc.Participant_Name__c);

                ServiceWrapper sw = new ServiceWrapper();
                sw.serviceId = svc.Id;
                sw.serviceName = svc.Support_Item_Name__c + ' (' + svc.Lineitem__c + ')';
                sw.participantId = svc.Client__c;

                if (!response.participantServices.containsKey(svc.Client__c)) {
                    response.participantServices.put(svc.Client__c, new List<ServiceWrapper>());
                }

                response.participantServices.get(svc.Client__c).add(sw);
            }

            // 🔹 2. Participant List
            for (Id pId : participantMap.keySet()) {
                ParticipantWrapper pw = new ParticipantWrapper();
                pw.participantId = pId;
                pw.participantName = participantMap.get(pId);
                response.participants.add(pw);
            }

            // 🔹 3. Transport Items (Filtered)
            if (!participantMap.isEmpty()) {

                List<ClientFundTrackerJN__c> fundList = [
                    SELECT Id,
                           Participant__c,
                           Amount__c,
                           NDIS_Support_Catalogue__r.Support_Item_Name__c,
                           NDIS_Support_Catalogue__r.Support_Item_Number__c,
                           State__c,
                           NDIS_Support_Catalogue__r.ACT__c,
                           NDIS_Support_Catalogue__r.NSW__c,
                           NDIS_Support_Catalogue__r.QLD__c,
                           NDIS_Support_Catalogue__r.VIC__c,
                           NDIS_Support_Catalogue__r.WA__c,
                           NDIS_Support_Catalogue__r.SA__c,
                           NDIS_Support_Catalogue__r.TAS__c,
                           NDIS_Support_Catalogue__r.NT__c,
                           NDIS_Support_Catalogue__r.Remote__c,
                           NDIS_Support_Catalogue__r.Very_Remote__c
                    FROM ClientFundTrackerJN__c
                    WHERE Participant__c IN :participantMap.keySet()
                    AND (
                        NDIS_Support_Catalogue__r.Support_Item_Name__c LIKE '%Travel%'
                        OR NDIS_Support_Catalogue__r.Support_Item_Name__c LIKE '%Transport%'
                    )
                ];

                for (ClientFundTrackerJN__c rec : fundList) {

                    Decimal amount = rec.Amount__c;

                    if (amount == null && rec.State__c != null && rec.NDIS_Support_Catalogue__r != null) {
                        amount = getRateByState(rec.NDIS_Support_Catalogue__r, rec.State__c);
                    }

                    TransportWrapper tw = new TransportWrapper();
                    tw.recordId = rec.Id;
                    tw.itemName = rec.NDIS_Support_Catalogue__r.Support_Item_Name__c;
                    tw.amount = amount;
                    tw.itemNumber=rec.NDIS_Support_Catalogue__r.Support_Item_Number__c;
                    tw.participantId = rec.Participant__c;

                    if (!response.participantTransportItems.containsKey(rec.Participant__c)) {
                        response.participantTransportItems.put(rec.Participant__c, new List<TransportWrapper>());
                    }

                    response.participantTransportItems.get(rec.Participant__c).add(tw);
                }
            }

            // ✅ SUCCESS RESPONSE
            responseMap.put('isSuccess', true);
            responseMap.put('data', response);

            res.statusCode = 200;

        } catch (Exception e) {

            // ❌ ERROR RESPONSE
            responseMap.put('isSuccess', false);
            responseMap.put('message', e.getMessage());

            res.statusCode = 500;
        }

        res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
    }

    // 🔹 Helper
    public static Decimal getRateByState(NDIS_Support_Catalogue__c cat, String state) {

        if (state == 'ACT') return cat.ACT__c;
        if (state == 'NSW') return cat.NSW__c;
        if (state == 'QLD') return cat.QLD__c;
        if (state == 'VIC') return cat.VIC__c;
        if (state == 'WA') return cat.WA__c;
        if (state == 'SA') return cat.SA__c;
        if (state == 'TAS') return cat.TAS__c;
        if (state == 'NT') return cat.NT__c;

        if (state == 'REMOTE') return cat.Remote__c;
        if (state == 'VERY_REMOTE') return cat.Very_Remote__c;

        return null;
    }
}