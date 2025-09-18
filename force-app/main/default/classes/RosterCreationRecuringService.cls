public class RosterCreationRecuringService {
    @AuraEnabled
    public static Map<String, Object> createRecurringServices(String parentShiftStaffId, List<ShiftwithStaff__c> shiftWithStaffList,map<Id,date>recurringDates ) {
    // Initialize response map
    Map<String, Object> response = new Map<String, Object>();
		system.debug('recurring dates in service '+recurringDates);
    try {
        ShiftwithStaff__c currentShift = [
            SELECT Id, Start_time_Formula__c, End_time_formula__c, Duration__c, Date__c,Recurring_Date__c ,
                (SELECT Id, Services__c, Funds_Tracker__c, Service_Users__c, Status__c, Date_of_Service__c, 
                        Client__c, State__c, Start_Time_24_Format__c, End_Time_24_Format__c, Service_Type__c,
                        ShiftwithStaff__c, Qty__c  
                 FROM Services_and_Support_Plans__r 
                 WHERE ShiftwithStaff__c =: parentShiftStaffId) 
            FROM ShiftwithStaff__c  
            WHERE Id =: parentShiftStaffId 
            LIMIT 1
        ];
        system.debug('currentShift SERVICES  '+currentShift.Services_and_Support_Plans__r);
        List<Services_and_Support_Plan__c> servicesupportlist = new List<Services_and_Support_Plan__c>();

        for (ShiftwithStaff__c shiftStaff : shiftWithStaffList) {
            // Skip processing if this shiftStaff is the parentShiftStaffId
            if (shiftStaff.Id == parentShiftStaffId) {
                continue; // Skip this iteration
            }
            
            for (Services_and_Support_Plan__c ss : currentShift.Services_and_Support_Plans__r) {
                Services_and_Support_Plan__c serviceRec = new Services_and_Support_Plan__c();
                serviceRec.Services__c = ss.Services__c;
                serviceRec.Funds_Tracker__c = ss.Funds_Tracker__c;
                serviceRec.Service_Users__c = ss.Service_Users__c;           
                serviceRec.Status__c = ss.Status__c;
                serviceRec.Date_of_Service__c = shiftStaff.Recurring_Date__c;
                serviceRec.Client__c = ss.Client__c;
                serviceRec.State__c = ss.State__c;
                serviceRec.Start_Time_24_Format__c = ss.Start_Time_24_Format__c;
                serviceRec.End_Time_24_Format__c = ss.End_Time_24_Format__c;
                serviceRec.Service_Type__c = ss.Service_Type__c;
                serviceRec.Qty__c = ss.Qty__c;
                serviceRec.Status__c='Not Yet Invoiced';
               //  serviceRec.GST__c='Yes';
                serviceRec.ShiftwithStaff__c = shiftStaff.Id; 
                servicesupportlist.add(serviceRec);  
            }
        }

        if (!servicesupportlist.isEmpty()) {
            insert servicesupportlist;
        }

        // Set success response
        response.put('isSuccess', true);
        response.put('ServicesMessage', 'Services created successfully');
    
    } catch (Exception e) {
        // Set failure response
        response.put('isSuccess', false);
        System.debug('Services creation failed: ' + e.getMessage());
        response.put('ServicesMessage', 'Failed to create services: ' + e.getMessage());
    }

    return response;
	}

}