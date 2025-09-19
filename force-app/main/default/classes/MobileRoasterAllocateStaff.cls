@RestResource(urlMapping='/roasterAdminallocateStaff/*')
global class MobileRoasterAllocateStaff {
    @HttpPost
    global static string doPost(String shiftId, String staffJson, Date shiftDate, List<ShiftwithStaff__c> shiftwithstaff) {  
        return AddShiftController.allocateMultipleStaff(shiftId, staffJson, shiftDate, shiftwithstaff);
    }

}