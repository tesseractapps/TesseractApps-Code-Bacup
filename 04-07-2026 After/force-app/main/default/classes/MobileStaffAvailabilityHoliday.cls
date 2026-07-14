@RestResource(urlMapping='/holidayListApi/*')
global class MobileStaffAvailabilityHoliday {
    @HttpGet
    global static void getHolidayListData(){
          RestResponse res = RestContext.response;
        Map<String, Object> responseMap = new Map<String, Object>();    
        try { 
            RestRequest req = RestContext.request;
            Map<String, String> requestParams = req.params;
            User objUser = [SELECT Id, Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId()];
            system.debug('objUser '+objUser);
            String orgState = [SELECT Id,Address_Latest__StateCode__s  FROM Organisation__c WHERE Name = :objUser.Organization_Name__c LIMIT 1].Address_Latest__StateCode__s;
             system.debug('orgState '+orgState);
            Integer yearParam = Integer.valueof(requestParams.get('year'));
            Date startDate = Date.newInstance(yearParam, 1, 1);
            Date endDate = Date.newInstance(yearParam, 12, 31);
            List<Public_Holiday__c> publicHolidays= LeaveController.getHolidayCount(startDate,endDate, AddShiftHandler.getStateFullForm(orgState));
            system.debug(' holidays ' +publicHolidays);
            list<holiDayWrapper> holidayList= new list<holiDayWrapper>();
            for(Public_Holiday__c holiday:publicHolidays){
                holiDayWrapper hd = new holiDayWrapper();
						hd.holiDayDate =holiday.Date__c;
						hd.holidayname=holiday.Holiday_Name__c;
						holidayList.add(hd);            
            }
            responseMap.put('holidaylist', holidayList);
            responseMap.put('success', true);
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
            
         } catch (Exception e) {
            responseMap.put('success', false);
            responseMap.put('message', 'Error creating ticket: ' + e.getMessage());
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
        }
    }
    global class holiDayWrapper { 
        global date holiDayDate;
        global string holiDayName;
        
    }

}