@RestResource(urlMapping='/RejectedShiftsAPI/*')
global class MobileAppRejectedShiftHandler {
     @HttpPost
    global static void  rejectShifts() {
        RestResponse res = RestContext.response;
        Map<String, Object> responseMap = new Map<String, Object>();
        try {
            RestRequest req = RestContext.request;
            String requestBody = req.requestBody.toString();
            system.debug('requestBody' +requestBody);

            if (String.isBlank(requestBody)) {
                responseMap.put('success', false);
                responseMap.put('message', 'Error: Request body cannot be empty.');
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                return;
            }

            // Deserialize JSON into wrapper class
            rejectedShiftWrapper rejectedShift = (rejectedShiftWrapper) JSON.deserialize(requestBody, rejectedShiftWrapper.class);
            
            if (rejectedShift == null || String.isBlank(rejectedShift.shiftStaffID) ||  String.isBlank(rejectedShift.RejectedComments) ) {
                responseMap.put('success', false);
                responseMap.put('message', 'Error: shiftStaffID and comments are required.');
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                return;
            }
            ShiftwithStaff__c shiftStaff = [SELECT Id, Add_Shift__r.facility__c,Attendence__c,Add_Shift__c, Comments__c FROM ShiftwithStaff__c WHERE Id = :rejectedShift.shiftStaffID LIMIT 1];
            shiftStaff.Attendence__c = false;
            shiftStaff.RejectedComments__c = rejectedShift.RejectedComments;
            shiftStaff.Shift_Rejected__c=true;
            update shiftStaff;
            
            Add_Shift__c parentShift = [
                SELECT Id, Quantity__c,Start_Date__c,Shift_Start_End_Time__c,Shift_Type__c,facility__c,Facility__r.Name,Location__Street__s,Location__City__s,Location__StateCode__s,Location__CountryCode__s,Location__PostalCode__s,Role__c,
                 Start_Time__c,End_Time__c,End_Date__c,Location__Latitude__s,Location__Longitude__s,
              (Select Id,Staff__c from ShiftwithStaffs__r  where Attendence__c =false )
                FROM Add_Shift__c
                WHERE Id = :shiftStaff.Add_Shift__c
                LIMIT 1
            ];
            parentShift.Quantity__c = (parentShift.Quantity__c != null) ? parentShift.Quantity__c + 1 : 1;
            update parentShift;
            list<ShiftwithStaff__c> rejectedChilds=parentShift.ShiftwithStaffs__r;
            list<string> staffIdList= new list<string>();
            for(ShiftwithStaff__c ss :rejectedChilds){
                staffIdList.add(ss.Staff__c);
            }
            string address=parentShift.Location__Street__s +','+parentShift.Location__City__s +','+parentShift.Location__StateCode__s +','+parentShift.Location__PostalCode__s ;
            String formattedStartTime = formatTimeToString(parentShift.Start_Time__c);
            String formattedEndTime = formatTimeToString(parentShift.End_Time__c);
            
            system.debug('staffIdList '+staffIdList); 
            StaffEmailNotificationController.sendRejectedEmailNotification(parentShift.Role__c, parentShift.facility__c, parentShift,staffIdList);
            MobileAppNotificationsV2.generateAndSendNotification(parentShift.Role__c, string.valueof(parentShift.Start_Date__c), '',true,'',shiftStaff.Add_Shift__r.facility__c,'addShift',null,false,
                                                                string.valueof(parentShift.End_Date__c),parentShift.Shift_Type__c,formattedStartTime,formattedEndTime,address,parentShift.Location__Latitude__s,parentShift.Location__Longitude__s);
                

            
            responseMap.put('success', true);
            responseMap.put('message', 'Shift Rejected successfully.');
            responseMap.put('recordId', shiftStaff.Id);
        } catch (Exception e) {
            responseMap.put('success', false);
            responseMap.put('message', 'Error: ' + e.getMessage());
        }
        res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
   }
     public static String formatTimeToString(Time t) {
        String hour = (t.hour() < 10) ? '0' + String.valueOf(t.hour()) : String.valueOf(t.hour());
        String minute = (t.minute() < 10) ? '0' + String.valueOf(t.minute()) : String.valueOf(t.minute());
        String second = (t.second() < 10) ? '0' + String.valueOf(t.second()) : String.valueOf(t.second());
        return hour + ':' + minute + ':' + second + 'Z';
    }

 global class rejectedShiftWrapper {
        public String shiftStaffID;
        public String RejectedComments;
       
    }
    

}