@RestResource(urlMapping='/myAvailabilityValidation/*')
global class mobileStaffAvailabilityValidation {
  @HttpPost
    global static void createstaffAvaialability() { 
        RestResponse res = RestContext.response;
        Map<String, Object> responseMap = new Map<String, Object>();
        
        try {
            RestRequest req = RestContext.request;
            String requestBody = req.requestBody.toString();
            System.debug('requestBody: ' + requestBody);
            availWrapper avail = (availWrapper) JSON.deserialize(requestBody, availWrapper.class);
            
             List<Date> inputDates=new List<Date> ();
            if(avail.isRecurring ==true){
                system.debug('avail.isRecurring ==> '+avail.isRecurring);
             Map<String, Object> recurDatesResult =
                RosterCreationRecurringHnadler.getNumberOfRecurrences(
                    avail.typeOfRecur,
                    Integer.valueOf(avail.recurEvery),
                    String.valueOf(avail.recurEndDate),
                    String.valueOf(avail.startDate),
                    avail.weeklyDays,
                    Integer.valueOf(avail.monthlyDay)
                );
                   inputDates = (List<Date>) recurDatesResult.get('RecurrenceDates');
          	 }else{
                  system.debug('avail.isRecurring false ==> '+avail.isRecurring);
                inputDates.add(date.valueof(avail.startDate));
            }
             Map<Id, Map<Date, String>> staffValidation= new  Map<Id, Map<Date, String>>();
          
			staffValidation=StaffAvailabilityValidation.validateStaffAvailabilityWithReasons(avail.staffIds, inputDates, avail.startTime, avail.endTime, 'Yes', avail.isEditMode, null, avail.availableId);
            
            
           
            responseMap.put('success', true);
            responseMap.put('message', 'Availability validated successfully');
             responseMap.put('message', staffValidation);
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
            
        } catch (Exception e) {
            System.debug('e.getMessage(): ' + e.getMessage());
            responseMap.put('success', false);
            responseMap.put('message', 'Error staff Availability: ' + e.getMessage());
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
        }
    }
    
    global class availWrapper {
       	global List<Id> staffIds;
        global List<Date> inputDates;
        global Id availableId;
      	global string startTime;
        global string endTime;
        global Boolean isEditMode;
        global boolean isRecurring;
        global list<String> weeklyDays; 
        global string recurEndDate;
        global string  typeOfRecur;
        global  Integer recurEvery;
        global Integer monthlyDay;
        global date startDate;
    }
}