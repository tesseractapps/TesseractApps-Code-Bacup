public with sharing class AddShiftParticipantView {
    @AuraEnabled(cacheable=true)
    public static totalParticipantDetailsWrapper getParticipantData(Date startDate, Date endDate, List<String> facIdlist, String orgID, String weekDataJson, String name,List<String> shiftTypeList, list<string> statusList) {
        System.debug('APEX: Called getParticipantData');
        totalParticipantDetailsWrapper tpw = new totalParticipantDetailsWrapper();
        
        String state = [SELECT Id, Address_Latest__StateCode__s FROM Organisation__c WHERE id = :orgID LIMIT 1].Address_Latest__StateCode__s;
        List<Public_Holiday__c> holidayList = LeaveController.getHolidayCount(startDate, endDate, AddShiftHandler.getStateFullForm(state));
        
        Map<Date, String> holidayMap = new Map<Date, String>();
        for (Public_Holiday__c holiday : holidayList) {
            holidayMap.put(holiday.Date__c, holiday.Holiday_Name__c);
        }
        
        List<Client__c> listOfClients = new List<Client__c>();  

    // Start building the query
        String query = 'SELECT Id, Facility__r.Name, Facility__r.Status__c, Name__c, AddressData__c, Address1__c, Address2__c,Total_Available_Funds__c,  ' + 
            'Picture__c, Organization_Name__c, Name, First_Name__c, Last_Name__c, Facility__c, Facility_Name__c, ' +
            'Status__c, Status_A__c, Contact_Number__c, Facility__r.Organisation__c, Address__Street__s, ' + 
            'Address__City__s, Address__StateCode__s, Address__CountryCode__s, Address__PostalCode__s, ' +
            'Participant_Status__c, (SELECT Id, Risk_Index__c, Name, Participant__c FROM Risk_Managements__r) ' + 
            'FROM Client__c WHERE Status__c=true and Facility__r.Status__c=true and ';
        
        // Add conditions dynamically
        List<String> conditions = new List<String>();
        
        // Name filter
        string cname=name;
        if (!String.isBlank(cname)) {
            cname = '%' + cname + '%';
            conditions.add('Name LIKE :cname');
        }
        
        // Organization Name filter using orgD parameter
        if (orgID != null) {
            String truncatedOrgId = String.valueOf(orgID).substring(0, 15);
            conditions.add('Organization_Name__c = :truncatedOrgId');
        }
        
        
        // Facility filter (ensuring the list is not empty)
        if (facIdlist != null && !facIdlist.isEmpty()) {
            conditions.add('Facility__c IN :facIdlist');
        }
        
        // Combine conditions into the query
        query += String.join(conditions, ' AND ');
         query += ' Order by createddate desc';
        System.debug('Final SOQL Query: ' + query);
        
        // Execute the query
        listOfClients = Database.query(query);
        set<id> cliIds= new set <id>();
        for(Client__c cc:listOfClients){
            cliIds.add(cc.id);
        }
        
        String serviceQuery = 'SELECT Id, Services__c, State__c, Service_Users__c, Service_Users__r.picture__c, Service_Users__r.Name, ' +
            'Resource_Name__c, Service_Type_Name__c, Lineitem__c, Support_Item_Name__c, Date_of_Service__c, Qty__c,Un_Assigned_Service__c,Assigned_Service__c, ' +
            'Unit_Price__c, GST__c, Amount__c, Status__c, Available_Funds__c, Available_Fund__c, ShiftwithStaff__c, ' +
            'ShiftwithStaff__r.Shiftcolor__c,ShiftwithStaff__r.Role_formula__c,ShiftwithStaff__r.Attendence__c,ShiftwithStaff__r.Status__c, Participant_Name__c, Client__c, Service_Type__c, Funds_Tracker__c, ' +
            'Start_Time_24_Format__c, End_Time_24_Format__c, Start_Time_Formula__c, End_Time_Formula__c FROM Services_and_Support_Plan__c WHERE ';
        
        // List to hold query conditions
        List<String> serviceConditions = new List<String>();
        
        // Client filter (Mandatory)
        if (!cliIds.isEmpty()) {
            serviceConditions.add('Client__c IN :cliIds');
        }
        
        // Date filter
        if (startDate != null && endDate != null) {
            serviceConditions.add('Date_of_Service__c >= :startDate AND Date_of_Service__c <= :endDate');
        }
        
        // Shift Type filter
        if (shiftTypeList != null && !shiftTypeList.isEmpty()) {
            serviceConditions.add('ShiftwithStaff__r.Type_of_shift__c IN :shiftTypeList');
        }
        
        // Status filter
        if (statusList != null && !statusList.isEmpty()) {
            serviceConditions.add('ShiftwithStaff__r.Status__c IN :statusList');
        }
        
        // Append conditions to query
        if (!serviceConditions.isEmpty()) {
            serviceQuery += String.join(serviceConditions, ' AND ');
        }
        
        // Add ORDER BY clause
        serviceQuery += ' ORDER BY createddate ASC';
        
        // Debug final query
        System.debug('Final Dynamic SOQL Query: ' + serviceQuery);
        
        // Execute the query
        List<Services_and_Support_Plan__c> serviceList = Database.query(serviceQuery);
        Map<Id, List<Services_and_Support_Plan__c>> serviceMap = new Map<Id, List<Services_and_Support_Plan__c>>();
        for (Services_and_Support_Plan__c serv : serviceList) {
            if (!serviceMap.containsKey(serv.Client__c)) {
                serviceMap.put(serv.Client__c, new List<Services_and_Support_Plan__c>());
            }
            serviceMap.get(serv.Client__c).add(serv);
        }
        
        System.debug('APEX: Retrieved ' + listOfClients.size() + ' clients');
        tpw.Participnat = new List<participantWrapper>();
        
        for (Client__c client : listOfClients) {
            participantWrapper participant = new participantWrapper();
            participant.participantId = client.Id;
            participant.firstName = client.First_Name__c;
            participant.lastName = client.Last_Name__c;
            participant.wages = client.Total_Available_Funds__c;
            participant.completedHours = 0;
            participant.profileUrl = client.Picture__c;
            participant.setHours = 0;
            List<String> riskLevels = new List<String>();

// Check if Risk_Managements__r is not null and contains records
            if (client.Risk_Managements__r != null && !client.Risk_Managements__r.isEmpty()) {
                for (Risk_Management__c risk : client.Risk_Managements__r) {
                    if (risk.Risk_Index__c != null) { // Avoid null values in risk index
                        riskLevels.add(risk.Risk_Index__c);
                    }
                }
            }
            
            // Determine Risk Status Priority
            String riskStatus = '';
            if (riskLevels.contains('Extreme')) {
                riskStatus = 'Extreme';
            } else if (riskLevels.contains('High')) {
                riskStatus = 'High';
            } else if (riskLevels.contains('Medium')) {
                riskStatus = 'Medium';
            } else {
                riskStatus = 'Risk Free'; // Default if no risk levels found
            }
            participant.riskStatus = riskStatus;
            participant.servicesByDay = new List<ParticipantShiftsByDayWrapper>();
            
            for (Integer i = 0; i < 7; i++) {
                Date currentDate = startDate.addDays(i);
                ParticipantShiftsByDayWrapper dayWrapper = new ParticipantShiftsByDayWrapper();
                dayWrapper.day = 'Day ' + i;
                dayWrapper.Shiftdate = currentDate;
                dayWrapper.services = new List<serviceWrapper>();
                dayWrapper.isSizeZeroFlag = (dayWrapper.serviceCount  <1 && dayWrapper.serviceCount  ==0)?true:false  ;  
                if (holidayMap.containsKey(currentDate)) {
                    dayWrapper.isHoliday = true;
                    dayWrapper.holidayName = holidayMap.get(currentDate);
                } else {
                    dayWrapper.isHoliday = false;
                    dayWrapper.holidayName = null;
                }
                participant.servicesByDay.add(dayWrapper);
            }
            
            if (serviceMap.containsKey(client.Id)) {
              
                for (Services_and_Support_Plan__c serv : serviceMap.get(client.Id)) {
                    Integer dayIndex = startDate.daysBetween(serv.Date_of_Service__c);
                    if (dayIndex >= 0 && dayIndex < 7) {
                        ParticipantShiftsByDayWrapper dayWrapper = participant.servicesByDay[dayIndex];
                        serviceWrapper servList = new serviceWrapper();
                        servList.Id = serv.Id;
                        servList.ShiftTime = serv.Start_Time_Formula__c + ' - ' + serv.End_Time_Formula__c;
                        servList.status = serv.Status__c;
                        servList.unassignedService= (serv.Un_Assigned_Service__c ==true ||  serv.Assigned_Service__c==true) ? true :false  ;
                        servList.serviceStaffName = serv.Resource_Name__c;
                         if(serv.Un_Assigned_Service__c==true)
                              servList.uiStatus='Unassigned' ;
                         if(serv.ShiftwithStaff__r.Attendence__c==true)
                             servList.uiStatus=serv.ShiftwithStaff__r.Status__c;
                        
                      //  servList.uiStatus =serv.Un_Assigned_Service__c ==false?'Assigned':'Unassigned' ;
                        servList.serviceStaffImage = serv.Service_Users__r.picture__c;
                        servList.RoleName =serv.ShiftwithStaff__r.Role_formula__c;
                        servList.shiftWithStaffId = serv.ShiftwithStaff__c;
                        Integer serviceCount = dayWrapper.services.size();
                        servList.isFirstRecordType = (serviceCount == 0);
                        servList.isSecondRecord = (serviceCount == 1);
                        servList.isThirdRecord = (serviceCount == 2);
                        servList.isFourthRecord = (serviceCount == 3);
                        servList.isSizeOne = (serviceCount == 0); // True if this is the only record
                        servList.shiftColor=serv.ShiftwithStaff__r.Shiftcolor__c;
                        if (serviceCount == 0 && serv.ShiftwithStaff__r.Shiftcolor__c != null) {
                            dayWrapper.firstRecordShiftColor = serv.ShiftwithStaff__r.Shiftcolor__c;
                        }
                        // Add service and update count
                        dayWrapper.services.add(servList);
                        dayWrapper.serviceCount++;
                        dayWrapper.isSizeZeroFlag = (dayWrapper.serviceCount  <1 && dayWrapper.serviceCount  ==0)?true:false  ; 
                         dayWrapper.moreThanOneflag = dayWrapper.serviceCount>1 ?true:false  ; 
                        dayWrapper.isSizeOneFlag=dayWrapper.serviceCount ==1?true:false;
                    }
                }
            }
            
            tpw.Participnat.add(participant);
        }
        
        tpw.weekData = (List<AddShiftStaffView.WeekDataWrapper>) JSON.deserialize(weekDataJson, List<AddShiftStaffView.WeekDataWrapper>.class);
        
        for (Integer i = 0; i < 7; i++) {
            Date currentDate = startDate.addDays(i);
            Boolean isToday = currentDate == Date.today();
            String todayLabel = isToday ? 'Today' : 'NotToday';
            
            AddShiftStaffView.WeekDataWrapper weekData = tpw.weekData[i];
            weekData.todayLabel = todayLabel;
            
            if (holidayMap.containsKey(currentDate)) {
                weekData.isHoliday = true;
                weekData.holidayColor = 'holiday';
                weekData.holidayName = holidayMap.get(currentDate);
            } else {
                weekData.isHoliday = false;
                weekData.holidayColor = isToday ? 'Today' : 'NotToday';
                weekData.holidayName = null;
            }
        }
        
        return tpw;
    }
     @AuraEnabled
    public static boolean getOverlappingShiftsData(String strtTimeText, String endTimeText, String StaffID, String startdate, String shiftType, Id ShiftwithStaffId) {
        DateTime startDateTime;
        DateTime endDateTime;
        Date enddate;
        boolean errorMessage = false;
        system.debug('ShiftwithStaffId >>'+ShiftwithStaffId);
        
        // Check if input time values are provided
        if (strtTimeText == null || endTimeText == null || StaffID == null || startdate == null || shiftType == null) {
            System.debug('One or more input values are null.');
            return false; // Early exit if any required value is missing
        }
        
        // Calculate Start and End Time
        Time startTime = AddShiftHandler.getTimeIn24HrFormat(strtTimeText);
        Time endTime = AddShiftHandler.getTimeIn24HrFormat(endTimeText);
        
        // Determine End Date based on Shift Type
        if (shiftType == 'Night' || shiftType == 'Sleepover Shift' || shiftType =='Custom') {
            List<String> timeSplit = endTimeText.split(' ');
            List<String> startTimeSplits = strtTimeText.split(' ');
            
            if (timeSplit[1] == 'am' && startTimeSplits[1] != 'am') {
                enddate = Date.valueOf(startdate).addDays(1);
            } else {
                enddate = Date.valueOf(startdate);
            }
        } else {
            enddate = Date.valueOf(startdate);
        }
        
        // Create DateTime for Start and End Shifts
        startDateTime = DateTime.newInstance(Date.valueOf(startdate), startTime);
        Date endShiftDate = (enddate != null) ? enddate : Date.valueOf(startdate);
        endDateTime = DateTime.newInstance(endShiftDate, endTime);
        
        // Query potential overlapping shifts
        /*List<ShiftwithStaff__c> potentialShifts = [
            SELECT Staff__c, Date__c, Start_Time__c, End_Date__c, End_Time__c
            FROM ShiftwithStaff__c
            WHERE Attendence__c = true
            AND (
                (Date__c <= :endDateTime.date()) AND (End_Date__c >= :startDateTime.date())
            )
            AND Staff__c IN :new List<String>{StaffID}  // Ensure StaffID is in a list
        ];*/
        
        Date startDateforQuery = startDateTime.date();
        Date endDateforQuery = endDateTime.date();
        List<Id> staffIdList = new List<Id>{StaffID};
        
        String baseQuery = 'SELECT Id, Staff__c, Date__c, Start_Time__c, End_Date__c, End_Time__c ' +
                           'FROM ShiftwithStaff__c WHERE Attendence__c = true ' +
                           'AND (Date__c <= :endDateforQuery AND End_Date__c >= :startDateforQuery) ' +
                           'AND Staff__c IN :staffIdList';
        
        if (ShiftwithStaffId != null) {
            baseQuery += ' AND Id != :ShiftwithStaffId';
        }
        
        List<ShiftwithStaff__c> potentialShifts = Database.query(baseQuery);
        system.debug('baseQuery >>'+baseQuery);
        system.debug('potentialShifts >>'+potentialShifts.size());
        
        List<ShiftwithStaff__c> overlappingShifts = new List<ShiftwithStaff__c>();
        
        // Perform DateTime comparison to find overlaps
        for (ShiftwithStaff__c shift : potentialShifts) {
            DateTime shiftStart = DateTime.newInstance(shift.Date__c, shift.Start_Time__c);
            Date shiftEndDate = (shift.End_Date__c != null) ? shift.End_Date__c : shift.Date__c;
            DateTime shiftEnd = DateTime.newInstance(shiftEndDate, shift.End_Time__c);
            
            // Check for overlap
            if (shiftStart <= endDateTime && shiftEnd >= startDateTime) {
                overlappingShifts.add(shift);
            }
        }
        
        // Debugging to check overlapping shifts
        System.debug('Available overlapping shifts: ' + overlappingShifts);
        
        // Handle the overlapping shifts
        if (overlappingShifts.size() > 0) {
            // Your logic to handle overlapping shifts
            errorMessage = true;
        } else {
            errorMessage = false;
        }
        
        return errorMessage;
    }


  
    public class totalParticipantDetailsWrapper {
        @AuraEnabled public List<AddShiftStaffView.WeekDataWrapper> weekData;
        @AuraEnabled public List<participantWrapper> Participnat;
    }

    public class participantWrapper {
        @AuraEnabled public String participantId;
        @AuraEnabled public String firstName;
        @AuraEnabled public String lastName;
        @AuraEnabled public Decimal wages;
        @AuraEnabled public Decimal completedHours;
        @AuraEnabled public String profileUrl;
        @AuraEnabled public Decimal setHours;
        @AuraEnabled public String riskStatus;
        @AuraEnabled public List<ParticipantShiftsByDayWrapper> servicesByDay;
    }
       
    public class ParticipantShiftsByDayWrapper {
        @AuraEnabled public String day;
        @AuraEnabled public Date Shiftdate;
        @AuraEnabled public string ShiftDateFormat;
        @AuraEnabled public List<serviceWrapper> services;
        @AuraEnabled public Integer serviceCount=0; 
        @AuraEnabled public boolean isSizeOneFlag=false; 
        @AuraEnabled public boolean isSizeZeroFlag=false; 
        @AuraEnabled public boolean moreThanOneflag=false; 
        @AuraEnabled  public boolean isHoliday ;
        @AuraEnabled public string holidayName;
        @AuraEnabled public String firstRecordShiftColor;
   
        
    }
    
    public class serviceWrapper {
        @AuraEnabled public String Id;
        @AuraEnabled public String ShiftTime;
        @AuraEnabled public String status;
        @AuraEnabled public String serviceStaffName;
        @AuraEnabled public String serviceStaffImage;
        @AuraEnabled public boolean isFirstRecordType ;
        @AuraEnabled public boolean isSecondRecord ;
        @AuraEnabled public boolean isThirdRecord ;
        @AuraEnabled public boolean isFourthRecord ;
        @AuraEnabled public boolean isSizeOne ;
        @AuraEnabled public string uiStatus ;
        @AuraEnabled public string shiftWithStaffId;
       @AuraEnabled public string shiftColor;
       @AuraEnabled public boolean unassignedService;
        @AuraEnabled public string RoleName;
     
    }
}