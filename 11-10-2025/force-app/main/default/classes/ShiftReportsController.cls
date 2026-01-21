public class ShiftReportsController {
    
	@AuraEnabled(cacheable=true)
    public static List<ShiftwithStaff__c> getShiftWithStaffData(
        String role, String employmentType, 
        String startWeekDate, String endWeekDate , String location ,  List<Id> facilityIds                 
    ) {
         System.debug('role: ' + role);
         System.debug('employmentType: ' + employmentType);
         System.debug('startWeekDate: ' + startWeekDate);
         System.debug('endWeekDate: ' + endWeekDate);
         System.debug('location: ' + location);
         System.debug(' Facility IDs passed  : ' + facilityIds);
        try {
            Id currentUserId = UserInfo.getUserId();
            System.debug('Current User ID: ' + currentUserId);
            
            List<User> userOrgName = [
                SELECT Id, Organization_Name__c, User_Type__c, Email
                FROM User
                WHERE Id = :currentUserId
                LIMIT 1
            ];
            if (userOrgName.isEmpty()) {
                throw new AuraHandledException('User not found');
            }
            
            List<Organisation__c> organisationList = [
                SELECT Id, Name
                FROM Organisation__c
                WHERE Name = :userOrgName[0].Organization_Name__c
            ];
             System.debug('organisationList: ' + organisationList);
            if (organisationList.isEmpty()) {
                throw new AuraHandledException('Organisation not found');
            }
            String organisationId = organisationList[0].Id;
            
            // Date parsing and weekday calculation
            if (!Pattern.matches('\\d{4}-\\d{2}-\\d{2}', startWeekDate) || !Pattern.matches('\\d{4}-\\d{2}-\\d{2}', endWeekDate)) {
                throw new AuraHandledException('Date format must be yyyy-MM-dd');
            }
            
            Date startDate = Date.valueOf(startWeekDate);
            Date endDate = Date.valueOf(endWeekDate);
            System.debug('startDate: ' + startDate);
            System.debug('endDate: ' + endDate);
			/*List<ShiftwithStaff__c> shiftList = new List<ShiftwithStaff__c>(); 
            
            shiftList = [
                   		 SELECT Id, Duration__c, Type_of_shift__c,Status__c, Start_Date__c, Role_formula__c,Staff__c,Staff_Name__c,Shift_Type__c,Add_Shift__r.Shift_Start_End_Time__c,
                		 Add_Shift__r.Get_Facility__c, Add_Shift__r.Participant_Address_checkbox__c, (SELECT Id,Participant_Name__c FROM Services_and_Support_Plans__r)
                     	 FROM ShiftwithStaff__c
                         WHERE Start_Date__c >= :startDate AND Start_Date__c <= :endDate AND Staff__r.Facility__r.Organisation__c = :organisationList[0].Id
                         AND (Role_formula__c = :role OR Staff__r.Type_of_Job__c = :employmentType)
                
                        ];*/
            String baseQuery = 
                'SELECT Id, Duration__c, Type_of_shift__c, Status__c, Start_Date__c,Date__c, Role_formula__c, Staff__c, ' +
                'Staff_Name__c, Shift_Type__c, Add_Shift__r.Shift_Start_End_Time__c, Staff__r.Display_Nickname__c,' +
                'Add_Shift__r.Get_Facility__c, Add_Shift__r.Participant_Address_checkbox__c, ' +
                '(SELECT Id, Participant_Name__c FROM Services_and_Support_Plans__r) ' +
                'FROM ShiftwithStaff__c WHERE Date__c >= :startDate AND Date__c <= :endDate ' +
                'AND Staff__r.Facility__r.Organisation__c = :organisationId ' +
                ' AND Status__c = \'Completed\' AND Staff__r.Facility__c IN :facilityIds';
               // 'AND (Role_formula__c = :role OR Staff__r.Type_of_Job__c = :employmentType)';
        
            if (String.isNotBlank(role) && role != 'All') {
                baseQuery += ' AND Role_formula__c = :role';
            }
            if (String.isNotBlank(employmentType) && employmentType != 'All') {
                baseQuery += ' AND Staff__r.Type_of_Job__c = :employmentType';
            }
            if (String.isNotBlank(location) && location != 'All') {
            // Add condition based on location
                if (location == 'Facility') {
                    baseQuery += ' AND Add_Shift__r.Get_Facility__c = false';
                } else if (location == 'Participant') {
                    baseQuery += ' AND Add_Shift__r.Get_Facility__c = true AND Add_Shift__r.Participant_Address_checkbox__c = true';
                } else if (location == 'Other') {
                    baseQuery += ' AND Add_Shift__r.Get_Facility__c = true AND Add_Shift__r.Participant_Address_checkbox__c = false';
                }
            } 
        	baseQuery += ' ORDER BY Date__c DESC';
            
            List<ShiftwithStaff__c> shiftList = Database.query(baseQuery);
            return  shiftList;
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching staff data: ' + e.getMessage());
        }
    }
     @AuraEnabled
    public static map<string,object> getAddShiftById(string shiftId){
        map<string,object> shiftWithStaffData=new map<string,object>();
        
        ShiftwithStaff__c addShiftdata=[SELECT Id,Staff_Name__c,Add_Shift__r.Shift_Notes__c,Add_Shift__c,Add_Shift__r.Start_Date__c , Staff__r.Display_Nickname__c, 
                                        Add_Shift__r.Shift_Start_End_Time__c,Add_Shift__r.Role__c,Client_Signature__c,Date__c,Status__c,
                                        (SELECT Id,Notes__c,CreatedDate FROM ShiftWithStaff_Activities__r),
                                        (SELECT Id,Total_Amount__c,Comments__c,Type_of_Vehicle__c,Approval_Status__c  FROM Reimbursements__r),
                                        (SELECT Id,Qty__c,Start_Time_Formula__c, Service_Type_Name__c FROM Services_and_Support_Plans__r)
                                        FROM ShiftwithStaff__c WHERE Id = :shiftId];
        
        list<Add_Shift_Checklist__c> addShiftCheckList=[select id ,Description__c,Mandatory__c,Add_Shift__c from Add_Shift_Checklist__c where Add_Shift__c=:addShiftdata.Add_Shift__c ];
        shiftWithStaffData.put('shiftwithstaffdata',addShiftdata);
        shiftWithStaffData.put('checklistdata',JSON.serialize(addShiftCheckList));
        
        return shiftWithStaffData;
    }
            
}