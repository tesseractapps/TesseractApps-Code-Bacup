@RestResource(urlMapping='/myAvailability/*')
global class MobileStaffAvailabilityHandler {
     @HttpGet
    global static void getAvailabilityData(){
    
      RestResponse res = RestContext.response;
        Map<String, Object> responseMap = new Map<String, Object>();    
        try { 
            RestRequest req = RestContext.request;
            Map<String, String> requestParams = req.params;
            Integer yearParam = Integer.valueof(requestParams.get('year'));
            Integer monthParam =Integer.valueof( requestParams.get('month'));
            Date startDate = Date.newInstance(yearParam, monthParam, 1);
            system.debug('startDate '+startDate);
              String UserEmail = UserInfo.getUserEmail(); 
            // End date: last day of the month
            Date endDate = startDate.addMonths(1).addDays(-1);
            system.debug('startDate '+startDate);
           List<Availability__c> staffAvailability= [SELECT  Shift_Type__c, Id, Start_Date__c, Start_Time__c, End_Time__c, Type_of_User__c, Funds_Tracker__c, State__c,staff__c,staff__r.NameToDisplay__c ,Assigned_Service_OR_Shift__c,End_Date__c  FROM Availability__c 
                    WHERE Staff__r.Email_Address__c =:UserEmail AND Start_Date__c  >= :startDate  AND Start_Date__c  <= :endDate order by Start_Date__c desc];
          
            list<availWrapper> availist= new list<availWrapper>();
            for(Availability__c avail:staffAvailability){
                availWrapper aw= new availWrapper();
                aw.staffName=avail.Staff__r.NameToDisplay__c;
                aw.staffId=avail.staff__c;
                aw.availableId=avail.Id;
                aw.shiftType=avail.Shift_Type__c;
             //   aw.startDate=avail.Start_Date__c;
                aw.endDate=avail.End_Date__c;
                aw.startDate=avail.Start_Date__c;
                aw.startTime=convertToAMPMFormat(avail.Start_Time__c).toLowercase();
                aw.endTime=convertToAMPMFormat(avail.End_Time__c).toLowercase();
                aw.isAssigned=avail.Assigned_Service_OR_Shift__c;
                availist.add(aw);
            }
            responseMap.put('availableList', availist);
            responseMap.put('success', true);
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
            
         } catch (Exception e) {
            responseMap.put('success', false);
            responseMap.put('message', 'Error creating ticket: ' + e.getMessage());
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
        }
    }
    @HttpPost
    global static void createstaffAvaialability() { 
        RestResponse res = RestContext.response;
        Map<String, Object> responseMap = new Map<String, Object>();
        
        try {
            RestRequest req = RestContext.request;
            String requestBody = req.requestBody.toString();
            System.debug('requestBody: ' + requestBody);
            
            if (String.isBlank(requestBody)) { failWithMessage(res, responseMap, 'Error: Request body cannot be empty.');
                return;
            }
            
            availWrapper avail = (availWrapper) JSON.deserialize(requestBody, availWrapper.class);
            
            if (avail.startDate == null) { failWithMessage(res, responseMap, 'Error: Start Date is required.');
                return;
            }
            if (String.isBlank(avail.startTime)) {
                failWithMessage(res, responseMap, 'Error: Start Time is required.');
                return;
            }
            if (String.isBlank(avail.endTime)) {
                failWithMessage(res, responseMap, 'Error: End Time is required.');
                return;
            }
            if (String.isBlank(avail.shiftType)) {
                failWithMessage(res, responseMap, 'Error: Shift Type is required.');
                return;
            }
            
            if (avail.isRecurring) {
                if (avail.recurEndDate == null) {
                    failWithMessage(res, responseMap, 'Error: Recur End Date is required for recurring availability.');
                    return;
                }
                if (Date.valueOf(avail.recurEndDate) <= avail.startDate) {
                    failWithMessage(res, responseMap, 'Error: Recur End Date must be after Start Date.');
                    return;
                }
                if (avail.recurEvery == null || avail.recurEvery <= 0) {
                    failWithMessage(res, responseMap, 'Error: recurEvery must be greater than 0 for recurring availability.');
                    return;
                }
                if (String.isBlank(avail.typeOfRecur)) {
                    failWithMessage(res, responseMap, 'Error: Type Of Recur is required.');
                    return;
                }
                if (avail.typeOfRecur == 'Weekly' && (avail.weeklyDays == null || avail.weeklyDays.isEmpty())) {
                    failWithMessage(res, responseMap, 'Error: weeklyDays are required for Weekly recurrence.');
                    return;
                }
                if (avail.typeOfRecur == 'Monthly' && avail.monthlyDay == null) {
                    failWithMessage(res, responseMap, 'Error: monthlyDay is required for Monthly recurrence.');
                    return;
                }
            }
            
            List<String> startAMPMParts = avail.startTime.toUpperCase().split(' ');
            List<String> endAMPMParts = avail.endTime.toUpperCase().split(' ');
            
            Map<String, Date> finalDates = calculateShiftDates(
                avail.shiftType,
                startAMPMParts[1],
                endAMPMParts[1],
                avail.startDate
            );
            
            List<String> startDateParts = String.valueOf(finalDates.get('startDate')).split('-');
            String startParseDate = startDateParts[2] + '/' + startDateParts[1] + '/' + startDateParts[0];
            
            List<String> endDateParts = String.valueOf(finalDates.get('endDate')).split('-');
            String endParseDate = endDateParts[2] + '/' + endDateParts[1] + '/' + endDateParts[0];
            
            String UserEmail = UserInfo.getUserEmail();
            List<Staff__c> staffList = StaffController.getStaffByEmail(UserEmail);
            Id availId = (String.isBlank(avail.availableId)) ? null : avail.availableId;
            
            Time strtTime24 = AddShiftHandler.getTimeIn24HrFormat(avail.startTime);
            Time endTime24 = AddShiftHandler.getTimeIn24HrFormat(avail.endTime);
            String timeStr = strtTime24.hour() + ':' + strtTime24.minute() + ':' + strtTime24.second();
            String endStr = endTime24.hour() + ':' + endTime24.minute() + ':' + endTime24.second();
              System.debug('👥 Staff List: ' + staffList);
            System.debug('📥 Inputs to saveStaffData():');
            System.debug('🆔 availableId: ' +availId);
            System.debug('📅 startParseDate: ' + startParseDate);
            System.debug('🔁 shiftType: ' + avail.shiftType);
            System.debug('🔄 isRecurring: ' + avail.isRecurring);
            System.debug('📆 weeklyDays: ' + avail.weeklyDays);
            System.debug('🕒 startTime (uppercase): ' + avail.startTime.toUpperCase());
            System.debug('🕒 endTime (uppercase): ' + avail.endTime.toUpperCase());
            System.debug('🧑‍ Staff Id: ' + staffList[0].Id);
            System.debug('📅 recurEndDate: ' + avail.recurEndDate);
            System.debug('📆 typeOfRecur: ' + avail.typeOfRecur);
            System.debug('🔁 recurEvery: ' + avail.recurEvery);
            System.debug('📅 monthlyDay: ' + avail.monthlyDay);
            System.debug('📅 endParseDate: ' + endParseDate);
            
            Boolean isOverLap = RosterAutoScheduleHandler.preventStaffAvailabilityDuplicates(
                startParseDate, endParseDate, timeStr, endStr, staffList[0].Id, availId
            );
            
              responseMap.put('isOverLap', isOverLap);
            if(isOverLap){
                responseMap.put('success', false);
                responseMap.put('message', 'You already have an existing availability or shift during the selected time.');
                 res.responseBody = Blob.valueOf(JSON.serialize(responseMap)); 
                 return;
            }
            avail.shiftType =avail.shiftType =='Sleepover' ?'Sleepover Shift' :avail.shiftType;
             
            StaffAvailabilityController.saveStaffData(
                availId, startParseDate, avail.shiftType, avail.isRecurring, avail.weeklyDays,
                avail.startTime.toUpperCase(), avail.endTime.toUpperCase(), Id.valueOf(staffList[0].Id),
                avail.recurEndDate, avail.typeOfRecur, avail.recurEvery, avail.monthlyDay, endParseDate
            );
            
            responseMap.put('success', true);
            responseMap.put('message', 'Availability saved successfully');
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
            
        } catch (Exception e) {
            System.debug('e.getMessage(): ' + e.getMessage());
            responseMap.put('success', false);
            responseMap.put('message', 'Error staff Availability: ' + e.getMessage());
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
        }
    }
    
    private static void failWithMessage(RestResponse res, Map<String, Object> responseMap, String message) {
        responseMap.put('success', false);
        responseMap.put('message', message);
        res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
    }
    
    public static Map<String, Date> calculateShiftDates(String shiftTypeValue, String startTimeAMPM, String endTimeAMPM, Date startDate) {
        Date endDate = startDate;
        Date updatedStartDate = startDate;
        
        if (shiftTypeValue == 'Night' || shiftTypeValue == 'Sleepover') {
            if (endTimeAMPM == 'AM' && startTimeAMPM == 'PM') {
                endDate = endDate.addDays(1);
            } else if (startTimeAMPM == 'AM' && endTimeAMPM == 'AM') {
                updatedStartDate = updatedStartDate.addDays(1);
                endDate = endDate.addDays(1);
            }
        } else if (shiftTypeValue == 'Custom') {
            if (startTimeAMPM == 'AM' && endTimeAMPM == 'AM') {
                endDate = endDate.addDays(1);
            } else if (endTimeAMPM == 'PM') {
                endDate = endDate.addDays(1);
            }
        }
        
        return new Map<String, Date>{
            'startDate' => updatedStartDate,
                'endDate' => endDate
                };
                    }
    
    global class availWrapper {
       global string staffName;
        global string staffId;
        global string availableId;
        global string shiftType;
        global date startDate;
        global date endDate;
      	global string startTime;
        global string endTime;
       	global boolean isAssigned;
        global boolean isRecurring;
        global list<String> weeklyDays; 
        global string recurEndDate;
        global string  typeOfRecur;
        global  Integer recurEvery;
        global Integer monthlyDay;
    }


    public static String convertToAMPMFormat(Time inputTime) {
        if (inputTime == null) return '';
        
        Integer hour = inputTime.hour();
        Integer minute = inputTime.minute();
        
        String period = hour >= 12 ? 'PM' : 'AM';
        Integer hour12 = (hour == 0) ? 12 : (hour > 12 ? hour - 12 : hour);
            
            String hourStr = String.valueOf(hour12);
        String minStr = minute < 10 ? '0' + minute : String.valueOf(minute);
        
        return hourStr + ':' + minStr + ' ' + period;
    }
    
}