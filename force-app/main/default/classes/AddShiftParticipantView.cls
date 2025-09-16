public with sharing class AddShiftParticipantView {
    @AuraEnabled(cacheable=true)
    public static totalParticipantDetailsWrapper getParticipantData(Date startDate, Date endDate, List<String> facIdlist, String orgID, String weekDataJson, String name,List<String> shiftTypeList, list<string> statusList) {
        System.debug('APEX: Called getParticipantData');
        totalParticipantDetailsWrapper tpw = new totalParticipantDetailsWrapper();
        
        String state = [SELECT Id, Address_Latest__StateCode__s FROM Organisation__c WHERE id = :orgID LIMIT 1].Address_Latest__StateCode__s;
        List<Public_Holiday__c> holidayList = LeaveController.getHolidayCount(startDate, endDate, AddShiftHandler.getStateFullForm(state));
         List<Shift_Type__c> shiftTypeAndTimings=[SELECT Id, Name,Facility__c, Start_Time__c, End_Time__c, Shift_Type__c,Colour__c  FROM Shift_Type__c WHERE Facility__c IN :facIdlist];  
         
          Map<Id, Map<String, String>> shiftTimeMap = new Map<Id, Map<String, String>>();

               for (Shift_Type__c sh : shiftTypeAndTimings) {
                    if (!shiftTimeMap.containsKey(sh.Facility__c)) {
                        shiftTimeMap.put(sh.Facility__c, new Map<String, String>());
                    }
                    String cssStyle = 'border-left: 6px solid ' + sh.Colour__c +
                                      '; background-color: '  + sh.Colour__c + '20; color: ' +sh.Colour__c +
                                      '; border-radius: 6px;';
                    shiftTimeMap.get(sh.Facility__c).put(sh.Id, cssStyle);
			}
           System.debug('shiftTimeMap ' +shiftTimeMap); 
        
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
            'Participant_Status__c, Risk_Status__c ' + 
            'FROM Client__c WHERE Status__c=true and Facility__r.Status__c=true and Facility__c IN :facIdlist and ';
        
        // Add conditions dynamically
        List<String> conditions = new List<String>();
        
        // Name filter
        string cname=name;
        if (!String.isBlank(cname)) {
            cname = '%' + cname + '%';
            conditions.add('Name__c LIKE :cname');
        }
        
        // Organization Name filter using orgD parameter
        if (orgID != null) {
            String truncatedOrgId = String.valueOf(orgID).substring(0, 15);
            conditions.add('Organization_Name__c = :truncatedOrgId');
        }
        
        
        // Facility filter (ensuring the list is not empty)
       /* if (facIdlist != null && !facIdlist.isEmpty()) {
            conditions.add('Facility__c IN :facIdlist');
        } */
        
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
            ' Service_Users__r.Display_Nickname__c,Resource_Name__c, Service_Type_Name__c, Lineitem__c, Support_Item_Name__c, Date_of_Service__c, Qty__c,Un_Assigned_Service__c,Assigned_Service__c,ShiftwithStaff__r.Add_Shift__r.Shift_Name__c,ShiftwithStaff__r.Add_Shift__r.Facility__c, ' +
            'Unit_Price__c, GST__c, Amount__c, Status__c, Available_Funds__c, Available_Fund__c, ShiftwithStaff__c,ShiftwithStaff__r.Add_Shift__r.Location__Street__s,ShiftwithStaff__r.Add_Shift__r.Location__City__s,ShiftwithStaff__r.Add_Shift__r.Shift_Notes__c, ' +
            'ShiftwithStaff__r.Shiftcolor__c,ShiftwithStaff__r.Role_formula__c,ShiftwithStaff__r.Attendence__c,ShiftwithStaff__r.Status__c, Participant_Name__c, Client__c, Service_Type__c, Funds_Tracker__c,ShiftwithStaff__r.Add_Shift__r.Facility_Name__c, ' +
            'Start_Time_24_Format__c, End_Time_24_Format__c, Start_Time_Formula__c, End_Time_Formula__c FROM Services_and_Support_Plan__c WHERE ShiftwithStaff__c !=null AND ShiftwithStaff__r.Shift_Rejected__c=false AND ';
        
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
        system.debug('statusList' +statusList);
       
        // Append conditions to query
        if (!serviceConditions.isEmpty()) {
            serviceQuery += String.join(serviceConditions, ' AND ');
        }
        /* if (statusList != null && statusList.contains('Unassigned') ){
            system.debug(' Unassigned if ' );
             serviceConditions.add('OR Un_Assigned_Service__c =true ');
         }*/
        
        
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
             participant.fullName = client.Name__c;
            participant.wages = client.Total_Available_Funds__c;
            participant.completedHours = 0;
             participant.facilityIdValue=client.Facility__c;
            participant.profileUrl = client.Picture__c;
            participant.setHours = 0;
            participant.riskStatus = (client.Risk_Status__c != null  && client.Risk_Status__c != ' ' ) ?client.Risk_Status__c :'Risk Free';
            participant.servicesByDay = new List<ParticipantShiftsByDayWrapper>();
            
            for (Integer i = 0; i < 7; i++) {
                Date currentDate = startDate.addDays(i);
                ParticipantShiftsByDayWrapper dayWrapper = new ParticipantShiftsByDayWrapper();
                dayWrapper.day = 'Day ' + i;
                dayWrapper.Shiftdate = currentDate;
                dayWrapper.services = new List<serviceWrapper>();
                dayWrapper.isSizeZeroFlag = (dayWrapper.serviceCount  <1 && dayWrapper.serviceCount  ==0)?true:false  ; 
                 dayWrapper.dynamicStyleFalg=dayWrapper.isSizeZeroFlag ==true? 'slds-text-align_center' :'slds-text-align_center style-td';
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
                        servList.serviceStaffName = serv.Service_Users__r.Display_Nickname__c;
                         if(serv.Un_Assigned_Service__c==true)
                              servList.uiStatus='Unassigned' ; 
                         if(serv.ShiftwithStaff__r.Attendence__c==true)
                             servList.uiStatus=serv.ShiftwithStaff__r.Status__c =='InProgress'?'In Progress' :serv.ShiftwithStaff__r.Status__c;
                        
                      //  servList.uiStatus =serv.Un_Assigned_Service__c ==false?'Assigned':'Unassigned' ;
                        servList.cssUiStatus=serv.Un_Assigned_Service__c==true? 'Unassigned' :serv.ShiftwithStaff__r.Status__c;
                        servList.twoRecordStatus=serv.Un_Assigned_Service__c==true? 'overlap-Unassigned' :'overlap-'+serv.ShiftwithStaff__r.Status__c;
                        servList.serviceStaffImage =serv.Un_Assigned_Service__c==true?'':serv.Service_Users__r.picture__c; 
                        servList.RoleName =serv.ShiftwithStaff__r.Role_formula__c;
                        servList.shiftWithStaffId = serv.ShiftwithStaff__c;
                        Integer serviceCount = dayWrapper.services.size();
                        servList.isFirstRecordType = (serviceCount == 0);
                        servList.singleShiftUistatus=  (serviceCount == 0) ? serv.Un_Assigned_Service__c==true? 'single-Unassigned' :'single-'+serv.ShiftwithStaff__r.Status__c :'';
                        servList.isSecondRecord = (serviceCount == 1);
                        servList.isThirdRecord = (serviceCount == 2);
                        servList.isFourthRecord = (serviceCount == 3);
                        servList.isSizeOne = (serviceCount == 0); // True if this is the only record
                        Id facilityId = serv.ShiftwithStaff__r.Add_Shift__r.Facility__c;
                        System.debug('facilityId ' +facilityId);
                        String shiftName = serv.ShiftwithStaff__r.Add_Shift__r.Shift_Name__c;
                        System.debug('shiftName ' +shiftName); 
                        // Check if map contains that facility and shift name
                        if (shiftTimeMap.containsKey(facilityId) && shiftTimeMap.get(facilityId).containsKey(shiftName)) {
                            servList.shiftColor = shiftTimeMap.get(facilityId).get(shiftName);
                        } else {
                            servList.shiftColor = 'border-left: 6px solid #D35701; background-color: #D3570120;color:#D35701; border-radius: 6px;';
                        }
                       // servList.shiftColor=serv.ShiftwithStaff__r.Shiftcolor__c;
                        if (serviceCount == 0 && serv.ShiftwithStaff__r.Shiftcolor__c != null) {
                            dayWrapper.firstRecordShiftColor = serv.ShiftwithStaff__r.Shiftcolor__c;
                        }
                        servList.ShiftStreet=serv.ShiftwithStaff__r.Add_Shift__r.Location__Street__s;
                        servList.ShiftCity=serv.ShiftwithStaff__r.Add_Shift__r.Location__City__s;
                        servList.Facility=serv.ShiftwithStaff__r.Add_Shift__r.Facility_Name__c;
                        servList.Notes=serv.ShiftwithStaff__r.Add_Shift__r.Shift_Notes__c;
                        servList.serviceTypeName=serv.Service_Type_Name__c;
                        dayWrapper.services.add(servList);
                        // Add service and update count

                        dayWrapper.serviceCount++;
                         if (!dayWrapper.services.isEmpty()) {
                                    Integer shiftCountPerDay = dayWrapper.services.size();
                                
                                    // Adjust available height by subtracting margin space
                                    Decimal totalAvailableHeight = 100 - ((shiftCountPerDay - 1) * 1);
                                    Decimal individualPercent = totalAvailableHeight / shiftCountPerDay;
                                
                                    Integer fontSize;
                                    if (shiftCountPerDay == 1) {
                                        fontSize = 16;
                                    } else if (shiftCountPerDay == 2) {
                                        fontSize = 13;
                                    } else if (shiftCountPerDay == 3) {
                                        fontSize = 14;
                                    } else {
                                        fontSize = 12; // Default for 4 or more
                                    }
                                
                                    for (serviceWrapper sw : dayWrapper.services) {
                                        sw.inLineHeight = sw.shiftColor + 
                                            'cursor: pointer; position:relative; margin-bottom:1%; height:' + 
                                            individualPercent.setScale(2, RoundingMode.HALF_UP) + '%; font-size:' + fontSize + 'px;';
                                    }
                                }

                        dayWrapper.isSizeZeroFlag = (dayWrapper.serviceCount  <1 && dayWrapper.serviceCount  ==0)?true:false  ; 
                        dayWrapper.dynamicStyleFalg=dayWrapper.isSizeZeroFlag ==true? 'style-try' :'slds-text-align_center style-td';
                         dayWrapper.moreThanOneflag = dayWrapper.serviceCount>1; 
                        dayWrapper.isSizeOneFlag=dayWrapper.serviceCount ==1;
                        dayWrapper.isSizeTwoFlag=dayWrapper.serviceCount==2;
                        dayWrapper.isSizeThreeFlag=dayWrapper.serviceCount==3;
                        dayWrapper.isSizeFourFlag=dayWrapper.serviceCount==4;
                        dayWrapper.moreThanFourFlag=dayWrapper.serviceCount>4;
                    }
                }
            }
            
            tpw.Participnat.add(participant);
        }
        
        tpw.weekData = (List<AddShiftStaffView.WeekDataWrapper>) JSON.deserialize(weekDataJson, List<AddShiftStaffView.WeekDataWrapper>.class);
        for (participantWrapper participant : tpw.Participnat) {
            for (ParticipantShiftsByDayWrapper dayWrapper : participant.servicesByDay) {
                if (dayWrapper.moreThanFourFlag && dayWrapper.services.size() > 4) {
                    List<AddShiftParticipantView.serviceWrapper> firstFour = new List<AddShiftParticipantView.serviceWrapper>();
                    for (Integer i = 0; i < 4; i++) {
                        firstFour.add(dayWrapper.services[i]);
                    }
                    dayWrapper.services = firstFour;
                    if (!dayWrapper.services.isEmpty()) {
                        Integer shiftCountPerDay = dayWrapper.services.size();
                        
                        Decimal totalAvailableHeight = 100 - ((shiftCountPerDay - 1) * 1);
                        Decimal individualPercent = totalAvailableHeight / shiftCountPerDay;
                        
                        Integer fontSize = 12; // Always 12 for 4 services
                        
                        for (AddShiftParticipantView.serviceWrapper sw : dayWrapper.services) {
                            sw.inLineHeight = sw.shiftColor +
                                'cursor: pointer; position:relative; margin-bottom:1%; height:' +
                                individualPercent.setScale(2, RoundingMode.HALF_UP) + '%; font-size:' + fontSize + 'px;';
                        }
                    }

                }
            }
        }
        
        for (Integer i = 0; i < 7; i++) {
            Date currentDate = startDate.addDays(i);
            Boolean isToday = currentDate == Date.today();
            String todayLabel = isToday ? 'Today' : 'NotToday';
            
            AddShiftStaffView.WeekDataWrapper weekData = tpw.weekData[i];
            weekData.todayLabel = todayLabel;
            
            if (holidayMap.containsKey(currentDate)) {
                weekData.isHoliday = true;
                weekData.holidayColor = 'day-cells holiday';
                weekData.holidayName = holidayMap.get(currentDate);
            } else {
                weekData.isHoliday = false;
                weekData.holidayColor = isToday ? 'day-cells Today' : 'day-cells NotToday';
                weekData.holidayName = null;
            }
        }
        
        return tpw;
    }
     @AuraEnabled
     public static Map<String, Object> getOverlappingShiftsData(
            String strtTimeText,
            String endTimeText,
            String StaffID,
            String startdate,
            String shiftType,
            Id ShiftwithStaffId
        ) {
            Map<String, Object> result = new Map<String, Object>{
                'isError' => false,
                'reason' => '',
               // 'overlappingShifts' => new List<ShiftwithStaff__c>(),
                'availabilityMatched' => true
            };
        
            if (strtTimeText == null || endTimeText == null || StaffID == null || startdate == null || shiftType == null) {
                result.put('isError', true);
                result.put('reason', 'One or more input values are null.');
                return result;
            }
        
            Time startTime = AddShiftHandler.getTimeIn24HrFormat(strtTimeText);
            Time endTime = AddShiftHandler.getTimeIn24HrFormat(endTimeText);
            
			 system.debug('startTime ' +startTime);
             system.debug('endTime ' +endTime); 
            system.debug('startdate ' +startdate);
            Date enddate;
              if (shiftType == 'Night' || shiftType == 'Sleepover Shift' || shiftType == 'Custom') {
                Long startTimeMs = startTime.hour() * 3600000 + startTime.minute() * 60000 + startTime.second() * 1000;
                Long endTimeMs = endTime.hour() * 3600000 + endTime.minute() * 60000 + endTime.second() * 1000;
                
                // If endTime is midnight (00:00) OR earlier than startTime → next day
                enddate = (endTimeMs == 0 || endTimeMs < startTimeMs) 
                    ? Date.valueOf(startdate).addDays(1) 
                    : Date.valueOf(startdate);
            } else {
                enddate = Date.valueOf(startdate);
            }
        
            DateTime startDateTime = DateTime.newInstance(Date.valueOf(startdate), startTime);
            DateTime endDateTime = DateTime.newInstance(enddate, endTime);
        
            Date startDateforQuery = startDateTime.date();
            Date endDateforQuery = endDateTime.date();
        
            String baseQuery = 'SELECT Id, Staff__c, Date__c, Start_Time__c, End_Date__c, End_Time__c ' +
                'FROM ShiftwithStaff__c WHERE Attendence__c = true ' +
                'AND (Date__c <= :endDateforQuery AND End_Date__c >= :startDateforQuery) ' +
                'AND Staff__c = :StaffID';
        
            if (ShiftwithStaffId != null) {
                baseQuery += ' AND Id != :ShiftwithStaffId';
            }
        
            List<ShiftwithStaff__c> potentialShifts = Database.query(baseQuery);
            system.debug('potentialShifts ' +potentialShifts);
            
            List<ShiftwithStaff__c> overlappingShifts = new List<ShiftwithStaff__c>();
        
            for (ShiftwithStaff__c shift : potentialShifts) {
                DateTime shiftStart = DateTime.newInstance(shift.Date__c, shift.Start_Time__c);
                Date shiftEndDate = (shift.End_Date__c != null) ? shift.End_Date__c : shift.Date__c;
                DateTime shiftEnd = DateTime.newInstance(shiftEndDate, shift.End_Time__c);
                 system.debug('shiftStart ' +shiftStart);
                 system.debug('shiftEnd ' +shiftEnd);
                 system.debug('endDateTime ' +endDateTime);
                  system.debug('startDateTime ' +startDateTime);
        
        
                if (shiftStart < endDateTime && shiftEnd > startDateTime) {
                    overlappingShifts.add(shift);
                }
            }
        
            if (!overlappingShifts.isEmpty()) {
                result.put('isError', true);
                result.put('reason', 'The selected staff already has a shift within the start and end times.');
              ///  result.put('overlappingShifts', overlappingShifts);
                return result;
            }
        
            // If no overlapping shifts, check availability
            List<Availability__c> availabilityList = [
                SELECT Start_Time__c, End_Time__c 
                FROM Availability__c 
                WHERE Staff__c = :StaffID 
                AND Start_Date__c = :startDateTime.date()
            ];
            system.debug('availabilityList '+availabilityList);
        
            Boolean availabilityMatch = true;
        
            if (availabilityList.isEmpty()) {
                availabilityMatch = true; // Allow shift if no restriction
            } else {
                for (Availability__c avail : availabilityList) {
                    Time availStart = avail.Start_Time__c;
                    Time availEnd = avail.End_Time__c;
                    system.debug('availStart '+availStart);
                    system.debug('availEn '+availEnd);
                    system.debug('startTime '+startTime);
                    system.debug('endTime '+endTime);
                    if (availStart != null && availEnd != null) {
                        // Overlap condition
                        if (availStart < endTime && availEnd > startTime) {
                            availabilityMatch = false;
                            break;
                        }
                    }
                }
            }
        
            if (!availabilityMatch) {
                result.put('isError', true);
                result.put('availabilityMatched', false);
                
                // Assign message to a string first
                String reasonMessage = 'The shift time overlaps with staff availability. Shift cannot be assigned.';
                result.put('reason', reasonMessage);
            }
            return result;
        }

    @AuraEnabled
    public static List<Shift_Type__c> getShiftTypes(List<Id> facIdlist) {
        if (facIdlist == null || facIdlist.isEmpty()) {
            return new List<Shift_Type__c>();
        }
        
        return [
            SELECT Id, Name, Facility__c, Start_Time__c, End_Time__c, Shift_Type__c, Colour__c 
            FROM Shift_Type__c 
            WHERE Facility__c IN :facIdlist
        ];
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
         @AuraEnabled public string facilityIdValue;
        @AuraEnabled public String profileUrl;
        @AuraEnabled public Decimal setHours;
        @AuraEnabled public String riskStatus;
         @AuraEnabled public String fullName;
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
        @AuraEnabled public string dynamicStyleFalg=''; 
        @AuraEnabled public boolean moreThanOneflag=false; 
        @AuraEnabled  public boolean isHoliday ;
        @AuraEnabled public string holidayName;
        @AuraEnabled public String firstRecordShiftColor;
        @AuraEnabled public boolean isSizeTwoFlag=false; 
        @AuraEnabled public boolean isSizeThreeFlag=false; 
        @AuraEnabled public boolean isSizeFourFlag=false; 
        @AuraEnabled public boolean moreThanFourFlag=false; 
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
        @AuraEnabled public string cssUiStatus ; 
        @AuraEnabled public string singleShiftUistatus;
        @AuraEnabled public string twoRecordStatus ; 
        @AuraEnabled public string shiftWithStaffId;
        @AuraEnabled public string shiftColor;
        @AuraEnabled public boolean unassignedService;
        @AuraEnabled public string RoleName;
        @AuraEnabled public string inLineHeight;
        @AuraEnabled public string originalColor;
        
        @AuraEnabled  public String ShiftStreet;
        @AuraEnabled  public String ShiftCity;
        @AuraEnabled  public string Facility;
        @AuraEnabled  public string Notes;
        @AuraEnabled  public string serviceTypeName;
    }
    
}