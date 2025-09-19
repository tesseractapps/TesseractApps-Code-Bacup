public class AddShiftHandler {
   public static Set<Id> shiftIdsToUpdate = new Set<Id>();
    public static void PreventDuplicateUpdate(List<Add_Shift__c> newShift,map<id,Add_Shift__c> oldShiftRecords){
        
         // Handle Before Update Logic
        if (oldShiftRecords == null) {
            handleBeforeUpdate(newShift);
        }

        // Handle After Update Logic
        if (oldShiftRecords != null) {
            handleAfterUpdate(newShift, oldShiftRecords);
        }
    }

    // Logic for Before Update
    private static void handleBeforeUpdate(List<Add_Shift__c> newShift) {
        for (Add_Shift__c shifts : newShift) {
            if (shifts.Start_Time_Text__c != null && shifts.End_Time_Text__c != null) {
                // Calculate Start and End Time
                Time startTime = getTimeIn24HrFormat(shifts.Start_Time_Text__c);
                Time endTime = getTimeIn24HrFormat(shifts.End_Time_Text__c);
                shifts.Start_Time__c = startTime;
                shifts.End_Time__c = endTime;

                // Determine End Date based on Shift Type
                if (shifts.Shift_Type__c == 'Night' || shifts.Shift_Type__c == 'Sleepover Shift' || shifts.Shift_Type__c == 'Custom' ) {
                    system.debug('Shift_Type__c  ' +shifts.Shift_Type__c);
                    List<String> timeSplit = shifts.End_Time_Text__c.split(' ');
                    List<String> startTimeSplits = shifts.Start_Time_Text__c.split(' ');
                    if (timeSplit[1] == 'am' && (startTimeSplits[1] != 'am'   || shifts.Shift_Type__c == 'Custom')) { 
                     
                        shifts.End_Date__c = shifts.Start_Date__c.addDays(1);
                           system.debug('End_Date__c  ' +shifts.End_Date__c);
                    } else {
                        shifts.End_Date__c = shifts.Start_Date__c;
                    }
                } else {
                    shifts.End_Date__c = shifts.Start_Date__c;
                }

                // Calculate Duration
                shifts.Duration__c = getDuartion(startTime, endTime, shifts.Start_Date__c, shifts.End_Date__c);
                system.debug('Location state code '+shifts.Location__StateCode__s);
				//System.debug('Holiday ' + LeaveController.getHolidayCount(shifts.Start_Date__c, shifts.Start_Date__c, getStateFullForm(shifts.Location__StateCode__s)).size());
                // Set Break Time
                shifts.Break__c = (shifts.Duration__c >= 5) ? '30' : '0';
            }
        }
    }

    // Logic for After Update
    private static void handleAfterUpdate(List<Add_Shift__c> newShift, Map<Id, Add_Shift__c> oldShiftRecords) {
        Set<Id> updatedParentIds = new Set<Id>();
        Map<Id, String> shiftNotes = new Map<Id, String>();

        for (Add_Shift__c shifts : newShift) {
            if (shifts.Shift_Notes__c != oldShiftRecords.get(shifts.Id).Shift_Notes__c) {
                updatedParentIds.add(shifts.Id);
                shiftNotes.put(shifts.Id, shifts.Shift_Notes__c);
            }
        }

        if (!updatedParentIds.isEmpty()) {
            // Query child records related to updated parents
            List<ShiftwithStaff__c> shiftwithStaffRecords = [
                SELECT Id, SignIn_Notes__c, Add_Shift__c 
                FROM ShiftwithStaff__c 
                WHERE Add_Shift__c IN :updatedParentIds
            ];

            // Update the child records with the parent's new Shift_Notes__c
            for (ShiftwithStaff__c staff : shiftwithStaffRecords) {
                staff.SignIn_Notes__c = shiftNotes.get(staff.Add_Shift__c);
            }

            // Perform DML update on the child records
            if (!shiftwithStaffRecords.isEmpty()) {
                update shiftwithStaffRecords;
            }
        }
    }

   
    public static time getTimeIn24HrFormat(string time12h){
       List<String> parts = time12h.split(' ');
        String timeSplit = parts[0];
        String modifier = parts[1].toLowerCase();
        
        List<String> timeParts = timeSplit.split(':');
        Integer hours = Integer.valueOf(timeParts[0]);
        Integer minutes = Integer.valueOf(timeParts[1]);

        if (hours == 12) {
            hours = 0;
        }

        if (modifier == 'pm') {
            hours += 12;
        }

        return Time.newInstance(hours, minutes, 0, 0);

    }
    public static decimal getDuartion(time startTime,time endTime,Date startDate,Date endDate){
        
        system.debug('t1 '+startTime);
        system.debug('t2 '+endTime);
        Datetime dt1 = Datetime.newInstance(startDate, Time.newInstance(startTime.hour(), startTime.minute(), 0, 0));
        Datetime dt2 = Datetime.newInstance(endDate, Time.newInstance(endTime.hour(), endTime.minute(), 0, 0));
        // Long timeDifferenceInMillis = dt2.getTime() - dt1.getTime();
       Long timeDifferenceInMillis = dt2.getTime() - dt1.getTime();
   
        system.debug('dt1 '+dt1);
        system.debug('dt2 '+dt2);                   
        // Convert milliseconds to hours
         Decimal timeDifferenceInHours = (Decimal) timeDifferenceInMillis / (1000 * 60 * 60);
         System.debug('Time Difference in Hours: ' + timeDifferenceInHours);
        if(timeDifferenceInHours >=5){
            timeDifferenceInHours -= 0.5;
        }
        
        System.debug('Time Difference in Hours: ' + timeDifferenceInHours);
        return timeDifferenceInHours;
        
    }
    
    public static String getStateFullForm(String stateShortForm) {
        String stateFullForm;
        switch on stateShortForm {
            when 'ACT' {
                stateFullForm = 'Australian Capital Territory';
            }
            when 'NSW' {
                stateFullForm = 'New South Wales';
            }
            when 'QLD' {
                stateFullForm = 'Queensland';
            }
            when 'VIC' {
                stateFullForm = 'Victoria';
            }
            when 'TAS' {
                stateFullForm = 'Tasmania';
            }
            when 'WA' {
                stateFullForm = 'Western Australia';
            }
            when 'SA' {
                stateFullForm = 'South Australia';
            }
            when 'NT' {
                stateFullForm = 'Northern Territory';
            }
            when else {
                stateFullForm = 'Unknown State';
            }
        }
        return stateFullForm;
    }
    
 }