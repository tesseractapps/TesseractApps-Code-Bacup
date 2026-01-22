public class SignInController {
    @AuraEnabled 
    public static List<ShiftwithStaff__c> PendingShifts(String startDate){
        String UserEmail = UserInfo.getUserEmail(); 
        //   Date todayDate = Date.Today();       
        system.debug('startDate'+startDate);
        Date sDate = Date.valueOf(startDate);
        List<ShiftwithStaff__c>shiftStaff = [select id,Staff__r.Email_Address__c,Staff__r.Facility__r.Name,Add_Shift__r.Start_Date__c,Add_Shift__r.Break__c,Add_Shift__r.End_Date__c,Enable_Sign_In__c,Enable_Sign_Out__c,Type_of_shift__c,
            Shift_Type__c,Shift_Locations__c,Add_Shift__r.shift_Start_End_Time__c,Add_Shift__r.Start_time_Formula__c,Add_Shift_Notes__c,Add_Shift__r.Facility__r.Name,Add_Shift__r.Role__c,
            Add_Shift__r.End_time_formula__c, Facility_Names__c,Date__c,Start_time_Formula__c,End_time_formula__c,Role_formula__c,Duration__c,Add_Shift_Duration_hh_mm__c,CreatedById,
            Log_Out_Date_Time__c,Log_In_Date_Time__c,SignIn_Notes__c,(select id from Reimbursements__r),(SELECT Id, Client__r.Name__c FROM Services_and_Support_Plans__r),Status__c,Sleepover_shift__c,Sleepover_Night_Shift_hours__c,
            (SELECT Id,Break_Start_Time__c,Break_End_Time__c  FROM Break_Timings__r WHERE Break_Start_Time__c != null AND Break_End_Time__c = null ORDER BY CreatedDate DESC LIMIT 1)
            from ShiftwithStaff__c
            where Staff__r.Email_Address__c=:UserEmail                                            
            and Start_Date__c =:sDate  and Attendence__c=true];
        return shiftStaff;
    }
    
  /*  @AuraEnabled 
    public static List<ShiftwithStaff__c> PendingShifts(String sdate, String edate) {
        String userEmail = UserInfo.getUserEmail(); 
        System.debug('sdate >> ' + sdate + ', edate >> ' + edate);
        
        Date startDate = Date.valueOf(sdate);
        Date endDate   = Date.valueOf(edate);
        
        List<ShiftwithStaff__c> shiftStaff = [
            SELECT Id, Staff__r.Email_Address__c, Staff__r.Facility__r.Name,
            Add_Shift__r.Start_Date__c, Add_Shift__r.Break__c,
            Add_Shift__r.End_Date__c, Enable_Sign_In__c, Enable_Sign_Out__c,
            Type_of_shift__c, Shift_Type__c, Shift_Locations__c,
            Add_Shift__r.shift_Start_End_Time__c, Add_Shift__r.Role__c,
            Add_Shift__r.Start_time_Formula__c, Add_Shift_Notes__c,
            Add_Shift__r.Facility__r.Name, Add_Shift__r.End_time_formula__c,
            Facility_Names__c, Date__c, Start_time_Formula__c,
            End_time_formula__c, Role_formula__c, Duration__c,
            Add_Shift_Duration_hh_mm__c, CreatedById,
            Log_Out_Date_Time__c, Log_In_Date_Time__c, SignIn_Notes__c,
            (SELECT Id FROM Reimbursements__r),
            (SELECT Id, Client__r.Name__c FROM Services_and_Support_Plans__r),
            Status__c, Sleepover_shift__c, Sleepover_Night_Shift_hours__c
            //(SELECT Id, Break_Start_Time__c, Break_End_Time__c  
            // FROM Break_Timings__r 
            // WHERE Break_Start_Time__c != null AND Break_End_Time__c = null 
            // ORDER BY CreatedDate DESC LIMIT 1)
            FROM ShiftwithStaff__c
            WHERE Staff__r.Email_Address__c = :userEmail
            AND Add_Shift__r.Start_Date__c >= :startDate
            AND Add_Shift__r.Start_Date__c <= :endDate
            AND Attendence__c = true
        ];
        return shiftStaff;
    }
    */

    
    @AuraEnabled
    public static string updateSignInTime(string loginTime,String signinId, boolean isSignInFromWeb){
        DateTime currentDateTime = System.now(); 
        String[] strTimeSplit = loginTime.split(':');
        Time timeChange = Time.newInstance( Integer.valueOf(strTimeSplit[0]) //hour
                                           ,Integer.valueOf(strTimeSplit[1]) //min
                                           ,currentDateTime.second()         //sec
                                           ,0);
        system.debug('timeChange==> ' + timeChange);
        
        try {
            ShiftwithStaff__c staffShift =  new ShiftwithStaff__c();
            staffShift.Id = signinId;
            staffShift.Log_In_Date_Time__c= timeChange;
            staffShift.SignIn_From_Web__c=isSignInFromWeb;
            
            update staffShift;
            return 'Updated Shift SignIn';
        } catch (Exception e) {
            return e.getMessage();
        }
    }
    @AuraEnabled
    public static string updateSignoutTime(string logOutTime,String signinId, String shiftNotes, boolean isSignOutFromWeb, Decimal SleepoverNightShiftHours,
                                           string nightShiftHourComments,string extendedComments){
                                               DateTime currentDateTime = System.now(); 
                                               String[] strTimeSplit = logOutTime.split(':');
                                               Time timeChange = Time.newInstance( Integer.valueOf(strTimeSplit[0]) //hour
                                                                                  ,Integer.valueOf(strTimeSplit[1]) //min
                                                                                  ,currentDateTime.second()        //sec
                                                                                  ,0);
                                               system.debug('timeChange==> ' + timeChange);
                                               System.debug('SleepoverNightShiftHours' +SleepoverNightShiftHours);
                                               
                                               String UserEmail = UserInfo.getUserEmail(); 
                                               
                                               //  ShiftwithStaff__c staffShift= [select id,Log_In_Date_Time__c,Log_Out_Date_Time__c,Date__C,Staff__c from ShiftwithStaff__c where Staff__r.Email_Address__c=:UserEmail
                                               //  ORDER BY Log_In_Date_Time__c desc NULLS LAST limit 1 ];
                                               try {
                                                   ShiftwithStaff__c staffShift =  new ShiftwithStaff__c();
                                                   staffShift.Id=signinId;
                                                   staffShift.Log_Out_Date_Time__c=timeChange;
                                                   staffShift.Shift_Notes__c = shiftNotes;
                                                   staffShift.Signout_From_Web__c=isSignOutFromWeb;
                                                   staffShift.Sleepover_Night_Shift_hours__c=SleepoverNightShiftHours;
                                                   staffShift.Staff_Extended_Shift_Reason__c=extendedComments;
                                                   staffShift.Staff_Night_Shift_Hours_Reason__c=nightShiftHourComments;
                                                   update staffShift;
                                                   system.debug('updayed');
                                                   return 'updated sign out time';
                                               }catch(exception e){
                                                   system.debug('err'+e.getMessage());
                                                   return e.getMessage();
                                               }
                                           } 
    
    @AuraEnabled
    public static string craeteReimbursement(string signinId,Decimal Amount,string MileageAndOthers,string comments, boolean isupdate, string reimbId, String typeofvehicle){
        String currentUserType;
        
        User currentUser = [
            SELECT Id, User_Type__c,Type_of_User__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];
        
        currentUserType = currentUser.Type_of_User__c;
        Decimal mileageValue =String.isNotEmpty(MileageAndOthers) ?  Decimal.valueOf(MileageAndOthers) :0;
        Decimal rate;
        Decimal mileageAmount;
        Decimal totalAmount;
        system.debug('currentUserType >>'+ currentUserType);
        //String UserEmail = UserInfo.getUserEmail();   
        system.debug('typeofvehicle >> '+ typeofvehicle);
        ShiftwithStaff__c staffShift= [select id,Log_In_Date_Time__c,Log_Out_Date_Time__c ,Add_Shift__r.Facility__r.Cost_per_Km_Electric__c,Add_Shift__r.Facility__r.Cost_per_Km_Fuel__c,Add_Shift__r.createdbyid,Add_Shift__r.Facility__r.Organisation__r.Cost_per_Km_Electric__c,Add_Shift__r.Facility__r.Organisation__r.Cost_per_KM__c,Add_Shift__r.Facility__r.Organisation__r.Mileage_Amount__c, Date__c,staff__c from ShiftwithStaff__c where Id=:signinId ];
        Reimbursement__c rei = new Reimbursement__c();
        rei.Mileage_Others__c=MileageAndOthers;
        system.debug('amount '+Amount);
        rei.Type_of_Vehicle__c = typeofvehicle;
        if(currentUserType == 'NDIS Org Admin'){
            if(typeofvehicle == 'Fuel'){
                rei.Total_Amount__c =(decimal.valueof(MileageAndOthers)*staffShift.Add_Shift__r.Facility__r.Organisation__r.Mileage_Amount__c)+(Amount !=null ?Amount:0);
                rei.Mileage_Amount__c=(decimal.valueof(MileageAndOthers)*staffShift.Add_Shift__r.Facility__r.Organisation__r.Mileage_Amount__c);
                rei.Fuel_Electric_Price__c = staffShift.Add_Shift__r.Facility__r.Organisation__r.Mileage_Amount__c;
            } 
            else {
                rei.Total_Amount__c =(decimal.valueof(MileageAndOthers)*staffShift.Add_Shift__r.Facility__r.Organisation__r.Cost_per_Km_Electric__c)+(Amount !=null ?Amount:0);
                rei.Mileage_Amount__c=(decimal.valueof(MileageAndOthers)*staffShift.Add_Shift__r.Facility__r.Organisation__r.Cost_per_Km_Electric__c);
                rei.Fuel_Electric_Price__c = staffShift.Add_Shift__r.Facility__r.Organisation__r.Cost_per_Km_Electric__c;
            }
        } else {
            if (typeofvehicle == 'Fuel') {
                // Try to get Facility Fuel Rate, fallback to Organisation Fuel Rate
                rate = (staffShift.Add_Shift__r.Facility__r.Cost_per_Km_Fuel__c == null || 
                        staffShift.Add_Shift__r.Facility__r.Cost_per_Km_Fuel__c == 0)
                    ? staffShift.Add_Shift__r.Facility__r.Organisation__r.Mileage_Amount__c
                    : staffShift.Add_Shift__r.Facility__r.Cost_per_Km_Fuel__c;
                
                
                mileageAmount = mileageValue * rate;
                totalAmount = mileageAmount + (Amount != null ? Amount : 0);
                
                rei.Mileage_Amount__c = mileageAmount;
                rei.Total_Amount__c = totalAmount;
                rei.Fuel_Electric_Price__c = rate;
            } else {
                // Try to get Facility Electric Rate, fallback to Organisation Electric Rate
                rate = (staffShift.Add_Shift__r.Facility__r.Cost_per_Km_Electric__c == null || 
                        staffShift.Add_Shift__r.Facility__r.Cost_per_Km_Electric__c == 0)
                    ? staffShift.Add_Shift__r.Facility__r.Organisation__r.Cost_per_Km_Electric__c
                    : staffShift.Add_Shift__r.Facility__r.Cost_per_Km_Electric__c;
                
                mileageAmount = mileageValue * rate;
                totalAmount = mileageAmount + (Amount != null ? Amount : 0);
                
                rei.Mileage_Amount__c = mileageAmount;
                rei.Total_Amount__c = totalAmount;
                rei.Fuel_Electric_Price__c = rate;
            }           
        }
        
        rei.Amount__c=Amount; 
        system.debug('amount '+rei.Amount__c);
        rei.Comments__c=comments;
        rei.Approval_Status__c='Pending';
        rei.Approval_user__c=staffShift.Add_Shift__r.createdbyid;
        
        if(isupdate == true){
            try{
                rei.id=reimbId;
                rei.isrevised__c=true;
                update rei;              
                return reimbId;
            }catch(exception e){
                return e.getMessage();
            }
        }else{
            try {
                rei.ShiftwithStaff__c=signinId;
                insert rei;
                return rei.id;            
            }catch(exception e){
                return e.getMessage();
            }
        } 
        
    }
    
    @AuraEnabled
    public static Map<String, Object> requestSignIn(String shiftId) {
        Map<String, Object> responseMap = new Map<String, Object>();
        
        try {
            if (String.isBlank(shiftId)) {
                responseMap.put('success', false);
                responseMap.put('message', 'Error: Request input cannot be empty.');
                return responseMap;
            }
            
            // Query the ShiftwithStaff record based on shiftId
            ShiftwithStaff__c shiftRecord = [
                SELECT Id, CreatedById, CreatedBy.Name, Enable_Sign_In__c 
                FROM ShiftwithStaff__c 
                WHERE Id = :shiftId 
                LIMIT 1
            ];
            
            // If sign-in is already enabled, return success
            if (shiftRecord.Enable_Sign_In__c == true) {
                responseMap.put('success', true);
                responseMap.put('Enable_Sign_In__c', shiftRecord.Enable_Sign_In__c);
                responseMap.put('message', 'Sign in is already enabled.');
                return responseMap;
            }
            
            system.debug('Before fetching task');
            
            // Check if a task already exists for enabling sign-in
            List<Task> existingTasks = [
                SELECT Id FROM Task 
                WHERE WhatId = :shiftRecord.Id 
                AND Subject = 'Enable Sign in for Shift' 
                AND Status = 'New' 
                LIMIT 1
            ];
            
            system.debug('After fetching task');
            
            // If a task already exists, return a message
            if (!existingTasks.isEmpty()) {
                responseMap.put('success', true);
                responseMap.put('Enable_Sign_In__c', shiftRecord.Enable_Sign_In__c);
                responseMap.put('message', 'Task already created for enabling Sign in.');
                return responseMap;
            }
            
            // If sign-in is not enabled, create a new task
            Task newTask = new Task(
                Subject = 'Enable Sign in for Shift',
                Status = 'New',
                Priority = 'Normal',
                OwnerId = shiftRecord.CreatedById, 
                WhatId = shiftRecord.Id, 
                Description = 'Task related to enabling Sign in for the shift.',
                ActivityDate = System.today()
            );
            
            insert newTask;
            
            // Return success response
            responseMap.put('success', true);
            responseMap.put('Enable_Sign_In__c', shiftRecord.Enable_Sign_In__c);
            responseMap.put('message', 'Sign in Requested and Task created.');
        } catch (Exception e) {
            responseMap.put('success', false);
            responseMap.put('message', 'Error: ' + e.getMessage());
        }
        
        return responseMap;
    }
    
    @AuraEnabled
    public static Map<String, Object> requestSignOut(String shiftId) {
        Map<String, Object> responseMap = new Map<String, Object>();
        
        try {
            if (String.isBlank(shiftId)) {
                responseMap.put('success', false);
                responseMap.put('message', 'Error: Request input cannot be empty.');
                return responseMap;
            }
            
            // Query the ShiftwithStaff record based on shiftId
            ShiftwithStaff__c shiftRecord = [
                SELECT Id, CreatedById, CreatedBy.Name, Enable_Sign_In__c,Enable_Sign_Out__c
                FROM ShiftwithStaff__c 
                WHERE Id = :shiftId 
                LIMIT 1
            ];
            
            // If sign-in is already enabled, return success
            if (shiftRecord.Enable_Sign_Out__c == true) {
                responseMap.put('success', true);
                responseMap.put('Enable_Sign_Out__c', shiftRecord.Enable_Sign_Out__c);
                responseMap.put('message', 'Sign out is already enabled.');
                return responseMap;
            }
            
            system.debug('Before fetching task');
            
            // Check if a task already exists for enabling sign-in
            List<Task> existingTasks = [
                SELECT Id FROM Task 
                WHERE WhatId = :shiftRecord.Id 
                AND Subject = 'Enable Sign out for Shift' 
                AND Status = 'New' 
                LIMIT 1
            ];
            
            system.debug('After fetching task');
            
            // If a task already exists, return a message
            if (!existingTasks.isEmpty()) {
                responseMap.put('success', true);
                responseMap.put('Enable_Sign_Out__c', shiftRecord.Enable_Sign_Out__c);
                responseMap.put('message', 'Task already created for enabling Sign out.');
                return responseMap;
            }
            
            // If sign-in is not enabled, create a new task
            Task newTask = new Task(
                Subject = 'Enable Sign out for Shift',
                Status = 'New',
                Priority = 'Normal',
                OwnerId = shiftRecord.CreatedById, 
                WhatId = shiftRecord.Id, 
                Description = 'Task related to enabling Sign out for the shift.',
                ActivityDate = System.today()
            );
            
            insert newTask;
            
            // Return success response
            responseMap.put('success', true);
            responseMap.put('Enable_Sign_Out__c', shiftRecord.Enable_Sign_Out__c);
            responseMap.put('message', 'Sign out Requested and Task created.');
        } catch (Exception e) {
            responseMap.put('success', false);
            responseMap.put('message', 'Error: ' + e.getMessage());
        }
        
        return responseMap;
    }
    
    @AuraEnabled
    public static Id  createBreakTimeRecord(Id shiftId, String breakInTime, Date breakStartDate){
        DateTime currentDateTime = System.now(); 
        String[] strTimeSplit = breakInTime.split(':');
        Time timeChange = Time.newInstance( Integer.valueOf(strTimeSplit[0]) //hour
                                           ,Integer.valueOf(strTimeSplit[1]) //min
                                           ,currentDateTime.second()         //sec
                                           ,0);
        system.debug('timeChange==> ' + timeChange);
        
        try {
            Break_Timings__c breakTime =  new Break_Timings__c();
            breakTime.ShiftwithStaff__c = shiftId;
            breakTime.Break_Start_Time__c= timeChange;
            breakTime.Break_Start_Date__c=breakStartDate;
            
            insert breakTime;
            return breakTime.Id;
        } catch (Exception e) {
            return e.getMessage();
        }
    }
    
    @AuraEnabled
    public static String updateBreakTimeRecord(Id breakId, String breakOutTime, Date breakEndDate){
        DateTime currentDateTime = System.now(); 
        String[] strTimeSplit = breakOutTime.split(':');
        Time timeChange = Time.newInstance( Integer.valueOf(strTimeSplit[0]) //hour
                                           ,Integer.valueOf(strTimeSplit[1]) //min
                                           ,currentDateTime.second()         //sec
                                           ,0);
        system.debug('timeChange==> ' + timeChange);
        
        try {
            Break_Timings__c breakTime = [SELECT Id FROM Break_Timings__c WHERE Id = :breakId LIMIT 1];
            // Break_Timings__c breakTime =  new Break_Timings__c();
            
            breakTime.Break_End_Time__c= timeChange;
            breakTime.Break_End_Date__c=breakEndDate;
            
            update breakTime;
            system.debug('updated' +breakTime.Id );
            return 'updated Break out time';
        }catch(exception e){
            system.debug('err'+e.getMessage());
            return e.getMessage();
        }
    }
    /*@AuraEnabled
    public static void updateSelectedBreakCheckboxes(List<Id> breakIds) {
        if (breakIds == null || breakIds.isEmpty()) return;

        List<Break_Timings__c> breakRecords = [
            SELECT Id, isBreakIncluded__c
            FROM Break_Timings__c
            WHERE Id IN :breakIds
        ];

        for (Break_Timings__c record : breakRecords) {
            record.isBreakIncluded__c = true;
        }

        update breakRecords;
    }*/
    @AuraEnabled
    public static void updateSelectedBreakCheckboxes(Id parentShiftId, List<Break_Timings__c> breakRecords) {
        if (breakRecords == null || breakRecords.isEmpty()) return;
    
        // Fetch current records from DB for this shift
        Map<Id, Break_Timings__c> existingRecords = new Map<Id, Break_Timings__c>(
            [SELECT Id, isBreakIncluded__c
             FROM Break_Timings__c
             WHERE ShiftwithStaff__c = :parentShiftId AND Id IN :breakRecords]
        );
    
        List<Break_Timings__c> recordsToUpdate = new List<Break_Timings__c>();
    
        for (Break_Timings__c inputRec : breakRecords) {
            Break_Timings__c existing = existingRecords.get(inputRec.Id);
            if (existing != null && existing.isBreakIncluded__c != inputRec.isBreakIncluded__c) {
                existing.isBreakIncluded__c = inputRec.isBreakIncluded__c;
                recordsToUpdate.add(existing);
            }
        }
    
        if (!recordsToUpdate.isEmpty()) {
            update recordsToUpdate;
            System.debug('🔄 Updated Break Records: ' + recordsToUpdate);
        } else {
            System.debug('✅ No changes detected, nothing to update.');
        }
    }
	 @AuraEnabled 
     public static List<ShiftwithStaff__c> getShiftDetailsById(String shiftId){
       // String UserEmail = UserInfo.getUserEmail(); 
        //   Date todayDate = Date.Today();       
        //system.debug('startDate'+startDate);
        //Date sDate = Date.valueOf(startDate);
        List<ShiftwithStaff__c>shiftStaff = [select Id,Staff__r.Email_Address__c,Staff__r.Facility__r.Name,Add_Shift__r.Start_Date__c,Add_Shift__r.Break__c,Add_Shift__r.End_Date__c,Enable_Sign_In__c,Enable_Sign_Out__c,Type_of_shift__c,
            Shift_Type__c,Shift_Locations__c,Add_Shift__r.shift_Start_End_Time__c,Add_Shift__r.Start_time_Formula__c,Add_Shift_Notes__c,Add_Shift__r.Facility__r.Name,Add_Shift__r.Role__c,Start_Time_24_format__c,End_Time_24_format__c ,
            Add_Shift__r.End_time_formula__c, Facility_Names__c,Date__c,Start_time_Formula__c,End_time_formula__c,Role_formula__c,Duration__c,Add_Shift_Duration_hh_mm__c,CreatedById,
            Log_Out_Date_Time__c,Log_In_Date_Time__c,SignIn_Notes__c,(select id from Reimbursements__r),(SELECT Id, Client__r.Name__c,Client__r.Display_Nickname__c FROM Services_and_Support_Plans__r),Status__c,Sleepover_shift__c,Sleepover_Night_Shift_hours__c,
            (SELECT Id,Break_Start_Time__c,Break_End_Time__c  FROM Break_Timings__r WHERE Break_Start_Time__c != null AND Break_End_Time__c = null ORDER BY CreatedDate DESC LIMIT 1)
            from ShiftwithStaff__c
            where Id =:shiftId ];                                         
            //and Add_Shift__r.Start_Date__c =:sDate  and Attendence__c=true
           // and Staff__r.Email_Address__c=:UserEmail ];
           
        return shiftStaff;
    }
    
}