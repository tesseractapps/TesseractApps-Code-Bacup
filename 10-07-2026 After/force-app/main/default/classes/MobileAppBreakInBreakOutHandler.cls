@RestResource(urlMapping='/breakInBreakOutApi/*')
global class MobileAppBreakInBreakOutHandler {

    global class breakInBreakOutWrapper {
        public String shiftId;
        public String breakId;
        public String breakInTime;
        public Date breakStartDate;
        public String breakOutTime;
        public Date breakEndDate;
    }

    @HttpPost
    global static void saveBreakInbreakOut() {
        RestResponse res = RestContext.Response;
        Map<String, Object> outputResponse = new Map<String, Object>();

        try {
            RestRequest req = RestContext.request;
            String requestBody = req.requestBody.toString();
            System.debug('🔹 Raw Request Body: ' + requestBody);

            if (String.isBlank(requestBody)) {
                outputResponse.put('success', false);
                outputResponse.put('message', 'Error: Request body cannot be empty.');
                res.responseBody = Blob.valueOf(JSON.serialize(outputResponse));
                System.debug('❌ Empty body detected');
                return;
            }

            breakInBreakOutWrapper breakDetails =
                (breakInBreakOutWrapper) JSON.deserialize(requestBody, breakInBreakOutWrapper.class);
            System.debug('✅ Parsed Break Details: ' + JSON.serialize(breakDetails));

            DateTime currentDateTime = System.now();
            System.debug('🔹 Current Datetime: ' + currentDateTime);

            Time timeChange;
            if (!String.isBlank(breakDetails.breakOutTime)) {
                String[] strTimeSplit = breakDetails.breakOutTime.split(':');
                timeChange = Time.newInstance(
                    Integer.valueOf(strTimeSplit[0]), // hour
                    Integer.valueOf(strTimeSplit[1]), // min
                    currentDateTime.second(),         // sec
                    0
                );
                System.debug('🔹 Break Out Time Parsed: ' + timeChange);
            } else if (!String.isBlank(breakDetails.breakInTime)) {
                String[] strTimeSplit = breakDetails.breakInTime.split(':');
                timeChange = Time.newInstance(
                    Integer.valueOf(strTimeSplit[0]),
                    Integer.valueOf(strTimeSplit[1]),
                    currentDateTime.second(),
                    0
                );
                System.debug('🔹 Break In Time Parsed: ' + timeChange);
            }

            Break_Timings__c breakTime = new Break_Timings__c();

            if (breakDetails.breakId != null && breakDetails.breakId !='' ) {
                System.debug('🟢 Updating existing Break with Id: ' + breakDetails.breakId);
                breakTime.Id = breakDetails.breakId;
                breakTime.Break_End_Time__c = timeChange;
                breakTime.Break_End_Date__c = breakDetails.breakEndDate;
            } else {
                System.debug('🟢 Creating new Break record');
                breakTime.Break_Start_Time__c = timeChange;
                breakTime.Break_Start_Date__c = breakDetails.breakStartDate;
            }

            breakTime.ShiftwithStaff__c = breakDetails.shiftId;
            System.debug('🔹 Final Break_Timings__c: ' + JSON.serialize(breakTime));

            upsert breakTime;
            System.debug('✅ Upsert Successful for Break_Timings__c');

            // success response
            outputResponse.put('success', true);
            outputResponse.put('message', 'Break timing saved successfully.');
            outputResponse.put('breakId', breakTime.Id); // return back new/updated Id
            res.responseBody = Blob.valueOf(JSON.serialize(outputResponse));

        } catch (Exception e) {
            System.debug('❌ Exception: ' + e.getMessage() + ' | Line: ' + e.getLineNumber());
            outputResponse.put('success', false);
            outputResponse.put('message', 'Error: ' + e.getMessage());
            res.responseBody = Blob.valueOf(JSON.serialize(outputResponse));
        }
    }
}