@RestResource(urlMapping='/ShiftsTypeByFacility/*')
global with sharing class MobileAppShiftsTypeByFacilityApi {

    @HttpGet
    global static void getShiftsTypeByFacility() {
        RestResponse res = RestContext.response;
        Map<String, Object> responseMap = new Map<String, Object>();

        try {
            RestRequest req = RestContext.request;
            String facilityId = req.params.get('facilityId');

            if (String.isBlank(facilityId)) {
                responseMap.put('isSuccess', false);
                responseMap.put('message', 'Facility Id is required');
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                return;
            }

            // Fetch Shifts
            List<Shift_Type__c> shiftList = [
                SELECT Id, Name, Start_Time__c, End_Time__c, Shift_Type__c,
                       Facility__r.Type_of_Service__c, Type_of_Shift__c, Facility__c,
                       (SELECT Id, Name, Custom_Shift_Type__c, Start_Time__c, Shift_Type__c, End_Time__c 
                        FROM Custom_Shift_Timings__r ORDER BY Index__c ASC)
                FROM Shift_Type__c
                WHERE Facility__c = :facilityId
            ];

            // Wrap Data
            List<ShiftWrapper> shiftWrapperList = new List<ShiftWrapper>();
            for (Shift_Type__c s : shiftList) {
                ShiftWrapper sw = new ShiftWrapper();
                sw.shiftId = s.Id;
                sw.shiftname = s.Name;
                sw.startTime = s.Start_Time__c;
                sw.endTime = s.End_Time__c;
                sw.shiftType = s.Shift_Type__c;
                sw.typeOfService = (s.Facility__r != null) ? s.Facility__r.Type_of_Service__c : null;
                sw.typeOfShift = s.Type_of_Shift__c;
                sw.facilityId = s.Facility__c;

                // Custom shift timings (no explicit object type, use generic SObject)
                List<CustomShiftWrapper> customList = new List<CustomShiftWrapper>();
                for (SObject sob : s.Custom_Shift_Timings__r) {
                    CustomShiftWrapper cw = new CustomShiftWrapper();
                    cw.customShiftId = (Id) sob.get('Id');
                    cw.customShiftname = (String) sob.get('Name');
                    cw.customShiftType = (String) sob.get('Custom_Shift_Type__c');
                    cw.startTime = (Time) sob.get('Start_Time__c');
                    cw.endTime = (Time) sob.get('End_Time__c');
                    cw.shiftType = (String) sob.get('Shift_Type__c');
                    customList.add(cw);
                }
                sw.customShiftTimings = customList;

                shiftWrapperList.add(sw);
            }

            // Success Response
            responseMap.put('isSuccess', true);
            responseMap.put('message', 'Shift types fetched successfully');
            responseMap.put('shifts', shiftWrapperList);
            res.statusCode = 200;

        } catch (Exception e) {
            responseMap.put('isSuccess', false);
            responseMap.put('message', 'Error fetching shift types');
            responseMap.put('error', e.getMessage());
            res.statusCode = 500;
        }

        res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
    }

    // Wrappers
    global class ShiftWrapper {
        public Id shiftId { get; set; }
        public String shiftname { get; set; }
        public Time startTime { get; set; }
        public Time endTime { get; set; }
        public String shiftType { get; set; }
        public String typeOfService { get; set; }
        public String typeOfShift { get; set; }
        public Id facilityId { get; set; }
        public List<CustomShiftWrapper> customShiftTimings { get; set; }
    }

    global class CustomShiftWrapper {
        public Id customShiftId { get; set; }
        public String customShiftname { get; set; }
        public String customShiftType { get; set; }
        public Time startTime { get; set; }
        public Time endTime { get; set; }
        public String shiftType { get; set; }
    }
}